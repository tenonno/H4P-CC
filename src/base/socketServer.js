"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const WebSocketServer = WebSocket.Server;
const Http = require("http");
const commandError_1 = require("./commandError");
const companionApp_1 = require("./companionApp");
const uuid = require("uuid");
const encryption_1 = require("./encryption");
class ServerCallbacks {
    constructor(connected, closed, error, command, listening) {
        this.eventCallbacks = {};
        this.onConnected = connected;
        this.onClosed = closed;
        this.onError = error;
        this.onCommandResponse = command;
        this.onListening = listening;
    }
}
exports.ServerCallbacks = ServerCallbacks;
class SocketServer {
    constructor(port, callbacks) {
        this.encryptionSubprotocol = "com.microsoft.minecraft.wsencrypt";
        this.closeRequestId = null;
        // Nice for breakpoint debugging
        this.lastSent = null;
        this.encryption = new encryption_1.Encryption();
        this.rawListenerCallback = null;
        let socketServer = this;
        this.callbacks = callbacks;
        this.server = Http.createServer((request, response) => {
            // Process HTTP request. Since we're writing just a WebSockets server we don't have to implement anything.
        });
        this.server.on('error', (e) => {
            let ce = new commandError_1.CommandError(commandError_1.ErrorCode.FailedToBind);
            ce.errorMessage += String(port);
            socketServer.callbacks.onError(ce, {});
        });
        this.server.listen(port, (e) => {
            this.callbacks.onListening();
            // Need to wait to make sure we listened succesfully because otherwise ws will throw
            // If we didn't manage to listen we'll get the error message above
            this.createWSServer();
            companionApp_1.getApp().debugLog(`WS server listening at ${this.getIPAddress()}:${port}`);
        });
    }
    createWSServer() {
        let socketServer = this;
        this.wsServer = new WebSocket.Server({
            server: this.server,
            handleProtocols: (protocols, shouldAccept) => {
                let foundProtocol = protocols.find((curVal) => {
                    return curVal == socketServer.encryptionSubprotocol || curVal == '';
                });
                // If no protocol is provided, protocols is {''}, so accept that too
                let accept = foundProtocol != null;
                // If they didn't ask for a protocol, we don't want to return one, so null for ''
                let protocol = foundProtocol == '' ? undefined : foundProtocol;
                companionApp_1.getApp().debugLog(`Accepted protocol? ${accept}`);
                shouldAccept(accept, protocol);
            }
        });
        // There are some rare errors that come out of nowhere and don't stop us from being able to continue, so just catch them and carry on
        this.wsServer.on('error', (err) => {
            companionApp_1.getApp().debugLog(`WebSocket Server error: ${err.message}`);
        });
        this.wsServer.on('connection', (client) => {
            // Drop old connection in favor of this one
            if (socketServer.hasConnection()) {
                // Refuse new one. Since it never connected, Minecraft won't try to reconnect constantly.
                companionApp_1.getApp().debugLog('Already have connection, refusing new one');
                client.close();
                return;
            }
            this.connectedClient = client;
            companionApp_1.getApp().debugLog(`Connected! ${this.getConnectedIP()}`);
            socketServer.callbacks.onConnected();
            this.connectedClient.on('close', (code, message) => {
                socketServer.callbacks.onClosed();
                socketServer.connectedClient = null;
                socketServer.encryption.disable();
                companionApp_1.getApp().debugLog('Connection closed');
            });
            this.connectedClient.on('message', (data, flags) => {
                let message = data;
                if (this.encryption.enabled()) {
                    message = this.encryption.decrypt(data);
                }
                if (this.rawListenerCallback != null) {
                    this.rawListenerCallback(message);
                }
                let response = null;
                try {
                    response = JSON.parse(message);
                }
                catch (e) {
                    // Should never happen
                    companionApp_1.getApp().debugLog('Failed to parse JSON from Minecraft, could be an encryption error');
                    socketServer.callbacks.onError(new commandError_1.CommandError(commandError_1.ErrorCode.FailedToParseCommandResponse), message);
                    socketServer.closeConnection();
                    return;
                }
                try {
                    let purpose = response.header.messagePurpose;
                    switch (purpose) {
                        case 'event': {
                            let callback = socketServer.callbacks.eventCallbacks[response.body.eventName];
                            if (callback != null) {
                                callback(response);
                                break;
                            }
                            else {
                                // Can happen if a previous websocket connection didn't unsubscribe 
                                if (this.rawListenerCallback == null) {
                                    companionApp_1.getApp().debugLog(`Received event this wasn't subscribed to: ${response.body.eventName}`);
                                }
                            }
                            break;
                        }
                        case 'commandResponse': {
                            // From minecraft's status code:
                            // Creates an MCRESULT. Similar to HRESULT, the first bit indicates success (0) or
                            // failure (1). The next 15 are a category code, indicating the system the error
                            // originated from. The remaining 16 bits are used to store a unique result code.
                            let statusCode = response.body.statusCode;
                            if ((statusCode & (1 << 31)) == 0) {
                                socketServer.callbacks.onCommandResponse(response);
                                break;
                            }
                            // else intentional fall through to error case
                        }
                        case 'error': {
                            if (socketServer.closeRequestId == response.header.requestId) {
                                companionApp_1.getApp().debugLog('Error with close request, forcing close');
                                socketServer.connectedClient.close();
                            }
                            else {
                                let cm = new commandError_1.CommandError(commandError_1.ErrorCode.FailedCommandExecution);
                                cm.errorMessage += `\n${response.body.statusMessage}`;
                                companionApp_1.getApp().debugLog(cm.errorMessage);
                                socketServer.callbacks.onError(cm, response);
                            }
                            break;
                        }
                        default: {
                            companionApp_1.getApp().debugLog('Unknown message purpose');
                            socketServer.callbacks.onError(new commandError_1.CommandError(commandError_1.ErrorCode.FailedToParseCommandResponse), response);
                            break;
                        }
                    }
                }
                catch (e) {
                    companionApp_1.getApp().debugLog(`Malformed response:\n${data.utf8Data}`);
                    socketServer.callbacks.onError(new commandError_1.CommandError(commandError_1.ErrorCode.FailedToParseCommandResponse), response);
                }
            });
            this.connectedClient.on('error', (err) => {
                companionApp_1.getApp().debugLog(err.message);
                let cm = new commandError_1.CommandError(commandError_1.ErrorCode.FailedToSendCommand);
                cm.errorMessage += `\n${err.message}`;
                socketServer.callbacks.onError(cm, null);
            });
        });
    }
    // This will disable all processing except encryption/decryption and forward all messages to this callback
    setRawListener(callback) {
        this.rawListenerCallback = callback;
    }
    hasConnection() {
        return this.connectedClient != null && (this.connectedClient.readyState == WebSocket.OPEN || this.connectedClient.readyState == WebSocket.CONNECTING);
    }
    getConnectedIP() {
        if (this.connectedClient != null) {
            let remoteAddress = this.connectedClient.upgradeReq.connection.remoteAddress;
            // Strip ::fff stuff off the front
            remoteAddress = remoteAddress.replace(/^.*:/, '');
            return remoteAddress;
        }
        return null;
    }
    getIPAddress() {
        const interfaces = require('os').networkInterfaces();
        for (let devName in interfaces) {
            let iface = interfaces[devName];
            for (let i = 0; i < iface.length; i++) {
                let alias = iface[i];
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    return alias.address;
                }
            }
        }
        return '0.0.0.0';
    }
    isConnected() {
        return this.connectedClient != null;
    }
    createCommand(input, commandName, commandOverload = 'default', version = 1) {
        return {
            "header": {
                "requestId": uuid.v4(),
                "messagePurpose": "commandRequest",
                "version": 1,
                "messageType": "commandRequest"
            },
            "body": {
                "input": input,
                "origin": {
                    "type": "player"
                },
                "name": commandName,
                "version": version,
                "overload": commandOverload
            }
        };
    }
    sendCommand(input, commandName, commandOverload = 'default', version = 1) {
        let command = this.createCommand(input, commandName, commandOverload, version);
        this.send(command);
        // At the moment we only plan on supporting one command at a time, but
        // this could be stored and used to match multiple requests to responses on a wrappwer class if the need arose
        return command.header.requestId;
    }
    sendText(text) {
        if (this.hasConnection()) {
            let message = text;
            if (this.encryption.enabled()) {
                this.connectedClient.send(this.encryption.encrypt(message), { binary: true });
            }
            else {
                this.connectedClient.send(message);
            }
        }
        else {
            companionApp_1.getApp().debugLog("Couldn't send, no connected client");
            if (this.rawListenerCallback != null) {
                this.rawListenerCallback('{"error":"Not connected"}');
            }
        }
    }
    send(command) {
        this.lastSent = command;
        this.sendText(JSON.stringify(command));
    }
    subscribeToEvent(eventName, callback) {
        this.callbacks.eventCallbacks[eventName] = callback;
        let subscribeBody = {
            "header": {
                "requestId": uuid.v4(),
                "messagePurpose": "subscribe",
                "version": 1,
                "messageType": "commandRequest"
            },
            "body": {
                "eventName": eventName
            }
        };
        this.send(subscribeBody);
    }
    closeConnection() {
        this.closeRequestId = this.sendCommand({}, "closewebsocket");
    }
    beginKeyExchange() {
        return this.encryption.beginDHExchange();
    }
    completeKeyExchange(publicKey) {
        return this.encryption.completeDHExchange(publicKey);
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=socketServer.js.map