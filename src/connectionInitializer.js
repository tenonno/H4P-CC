"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const companionApp_1 = require("./base/companionApp");
const commandError_1 = require("./base/commandError");
let requiredCompanionProtocol = 2;
var ConnectionStage;
(function (ConnectionStage) {
    ConnectionStage[ConnectionStage["NotConnected"] = 0] = "NotConnected";
    ConnectionStage[ConnectionStage["CheckingVersion"] = 1] = "CheckingVersion";
    ConnectionStage[ConnectionStage["EnablingEncryption"] = 2] = "EnablingEncryption";
    ConnectionStage[ConnectionStage["CreatingAgent"] = 3] = "CreatingAgent";
    ConnectionStage[ConnectionStage["Complete"] = 4] = "Complete";
})(ConnectionStage || (ConnectionStage = {}));
class ConnectionInitializer {
    constructor() {
        this.connectionStage = ConnectionStage.NotConnected;
    }
    sendCommand(input, commandName) {
        this.curCommandId = companionApp_1.getApp().server.sendCommand(input, commandName);
    }
    onConnected() {
        this.connectionStage = ConnectionStage.CheckingVersion;
        this.sendCommand({}, 'geteduclientinfo');
        companionApp_1.getApp().debugLog('Client connected to Code Connection');
    }
    callback(error) {
        companionApp_1.getApp().onConnectionComplete.call(companionApp_1.getApp(), error);
    }
    verifyGetClientInfo(command) {
        let body = command.body;
        if (body == null) {
            companionApp_1.getApp().debugLog('Error getting client info');
            return commandError_1.ConnectionError.GetInfoError;
        }
        let cVersion = body.companionProtocolVersion;
        if (cVersion < requiredCompanionProtocol) {
            companionApp_1.getApp().debugLog('Connected Minecraft is out of date');
            return commandError_1.ConnectionError.MinecraftOutOfDate;
        }
        if (cVersion > requiredCompanionProtocol) {
            companionApp_1.getApp().debugLog('Code Connection is out of date');
            return commandError_1.ConnectionError.ThisOutOfDate;
        }
        companionApp_1.getApp().telemetry.clientId = body.hostuuid;
        companionApp_1.getApp().telemetry.playerSessionid = body.playersessionuuid;
        return commandError_1.ConnectionError.None;
    }
    onCommandResponse(response) {
        if (response.header.requestId != this.curCommandId) {
            companionApp_1.getApp().debugLog('Returned command id did not match verification request id');
            return;
        }
        switch (this.connectionStage) {
            case ConnectionStage.CheckingVersion: {
                let verificationError = this.verifyGetClientInfo(response);
                if (verificationError != commandError_1.ConnectionError.None) {
                    this.callback(verificationError);
                    return;
                }
                companionApp_1.getApp().debugLog('Client is in education mode');
                this.connectionStage = ConnectionStage.EnablingEncryption;
                let params = companionApp_1.getApp().server.beginKeyExchange();
                this.sendCommand({ 'publicKey': params.publicKey, 'salt': params.salt }, 'enableencryption');
                break;
            }
            case ConnectionStage.EnablingEncryption: {
                if (response.body.publicKey == null || companionApp_1.getApp().server.completeKeyExchange(response.body.publicKey) == false) {
                    this.callback(commandError_1.ConnectionError.GetInfoError);
                    return;
                }
                companionApp_1.getApp().debugLog('Encryption enabled');
                this.connectionStage = ConnectionStage.CreatingAgent;
                this.sendCommand({}, 'createagent');
                break;
            }
            case ConnectionStage.CreatingAgent: {
                companionApp_1.getApp().debugLog('Agent created');
                this.connectionStage = ConnectionStage.Complete;
                this.callback(commandError_1.ConnectionError.None);
                break;
            }
            default: {
                companionApp_1.getApp().debugLog('Unexpected connection stage in command response');
                break;
            }
        }
    }
    onError(error) {
        // Close web socket connection if error occurs
        companionApp_1.getApp().server.closeConnection();
        companionApp_1.getApp().debugLog('Connection initialization error, aborting connection');
        this.callback(commandError_1.ConnectionError.GetInfoError);
    }
}
exports.ConnectionInitializer = ConnectionInitializer;
//# sourceMappingURL=connectionInitializer.js.map