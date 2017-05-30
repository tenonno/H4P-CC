"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../typings/index.d.ts" />
const electron_1 = require("electron");
const WS = require("./socketServer");
const commandGlue_1 = require("./commandGlue");
const commandError_1 = require("./commandError");
const telemetry_1 = require("./telemetry");
class CompanionApp {
    constructor() {
        this.onViewLoad = null;
        this.wsPort = 19131;
        this.restPort = 8080;
        this.server = null;
        this.commandGlue = null;
        this.connectionInitializer = null;
        this.companionListener = null;
        this.telemetry = new telemetry_1.Telemetry();
        this.queuedLogs = [];
        this.debugWindowReady = false;
    }
    getCommandGlue() {
        return this.commandGlue;
    }
    getIPAddress() {
        return this.server.getIPAddress();
    }
    debugLog(message) {
        if (this.debugWin != null && this.debugWindowReady) {
            this.debugWin.webContents.send('log', message);
        }
        else {
            this.queuedLogs.push(message);
        }
        console.log(message);
    }
    createDebugWindow() {
        this.debugWin = new electron_1.BrowserWindow({ width: 800, height: 600 });
        this.debugWin.setMenu(null);
        let self = this;
        this.debugWin.on('closed', () => {
            self.debugWin = null;
        });
        this.debugWin.webContents.on('did-finish-load', () => {
            this.debugWindowReady = true;
            for (let i = 0; i < this.queuedLogs.length; ++i) {
                this.debugLog(this.queuedLogs[i]);
            }
            this.queuedLogs = [];
        });
        this.debugWin.loadURL(`file://${__dirname}/debugView.html`);
    }
    closeDebugWindow() {
        if (this.debugWin) {
            this.debugWin.close();
        }
    }
    initCommandLayer(options = {}) {
        let init = options.connectionInitializer;
        let listener = options.companionListener;
        if (init != null) {
            this.setConnectionInitializer(init);
        }
        if (listener != null) {
            this.setCompanionListener(listener);
        }
        this.server = new WS.SocketServer(this.wsPort, new WS.ServerCallbacks(this.onConnected, this.onClosed, this.onError, this.onCommandResponse, this.onListening));
        this.commandGlue = new commandGlue_1.CommandGlue(this.server);
    }
    setConnectionInitializer(initializer) {
        this.connectionInitializer = initializer;
    }
    setCompanionListener(listener) {
        //One should do, and if it really isn't enough, the attached listener can be responsible for passing the messages along
        this.companionListener = listener;
    }
    setRawSocketListener(callback) {
        this.server.setRawListener(callback);
    }
    onListening() {
        if (getApp().companionListener != null) {
            getApp().companionListener.onListening();
        }
    }
    onConnectionComplete(error) {
        switch (error) {
            case commandError_1.ConnectionError.None:
                this.commandGlue.onConnected();
                // Now socket server sends command response and error to the glue
                this.messageTarget = this.commandGlue;
                break;
            case commandError_1.ConnectionError.GetInfoError:
                this.debugLog('Error validating connection');
                break;
            case commandError_1.ConnectionError.ThisOutOfDate:
                this.debugLog('Please update this application to the latest version.');
                break;
            case commandError_1.ConnectionError.MinecraftOutOfDate:
                this.debugLog('Please update Minecraft: Education Edition to the latest version.');
                break;
        }
        if (this.companionListener) {
            this.companionListener.onConnectionValidated(error);
        }
    }
    onConnected() {
        let self = getApp();
        // Now socket server sends command response and error to the connection initializer
        self.messageTarget = self.connectionInitializer;
        if (self.connectionInitializer != null) {
            self.connectionInitializer.onConnected.call(self.connectionInitializer);
        }
        else {
            // If no initializer is given, skip it
            self.onConnectionComplete.call(self, commandError_1.ConnectionError.None);
        }
        // Do this last so that the callback could run commands if it wanted to
        if (self.companionListener) {
            self.companionListener.onConnectionEstablished();
        }
    }
    onClosed() {
        let self = getApp();
        self.commandGlue.onClosed();
        if (self.companionListener) {
            self.companionListener.onClosed();
        }
    }
    onError(error, response) {
        let self = getApp();
        if (self.messageTarget != null) {
            self.messageTarget.onError(error, response);
        }
        if (self.companionListener) {
            self.companionListener.onCommandError(error);
        }
    }
    onCommandResponse(response) {
        let self = getApp();
        self.messageTarget.onCommandResponse(response);
        if (self.companionListener) {
            self.companionListener.onCommandResponse(response);
        }
    }
}
exports.CompanionApp = CompanionApp;
let companionApp = new CompanionApp();
function getApp() {
    return companionApp;
}
exports.getApp = getApp;
//# sourceMappingURL=companionApp.js.map