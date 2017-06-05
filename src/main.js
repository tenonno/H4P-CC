"use strict";
/// <reference path="typings/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
let startupTime = process.hrtime();
const electron_1 = require("electron");
const restServer_1 = require("./restServer");
const connectionInitializer_1 = require("./connectionInitializer");
const commandError_1 = require("./base/commandError");
const companionApp_1 = require("./base/companionApp");
const connectedViewController_1 = require("./connectedViewController");
const sharedConstants_1 = require("./base/sharedConstants");
// Dimension constants
const defaultViewWidth = 905;
const defaultViewHeight = 532;
const editorWidth = 800;
const editorMinWidth = 500;
const editorHeight = 600;
const editorMinHeight = 500;
const splitViewMinWidth = 1024;
// The base uri that will launch this application
const launchURI = 'codeconnection';
const minecraftURI = 'minecraftedu://?wsserver=ws://localhost:';
// Command-line option to open dev tools for browser windows and hosted webviews
const openDevTools = true; //process.argv.indexOf('--devtools') > -1;
let win;
let onViewLoad = null;
let restServer = restServer_1.RestServer;
let restPort = 8080;
let wasURILaunched = false;
let timeCreatedMS = Date.now();
let connectedViewController = new connectedViewController_1.ConnectedViewController();
function setURILaunched() {
    companionApp_1.getApp().debugLog('Was launched via URI');
    wasURILaunched = true;
}
function getWindow() {
    return win;
}
exports.getWindow = getWindow;
function getShouldOpenDevTools() {
    return openDevTools;
}
exports.getShouldOpenDevTools = getShouldOpenDevTools;
function gotoWaitingView() {
    gotoView('waitingView.html', () => {
        win.webContents.send('setCommandString', `/connect ${companionApp_1.getApp().server.getIPAddress()}:${companionApp_1.getApp().wsPort}`);
    });
}
function gotoErrorView(errorMessage) {
    gotoView('errorView.html', () => {
        win.webContents.send('setErrorString', errorMessage);
    });
}
function gotoView(filename, loadedCallback) {
    setDefaultWindow();
    gotoURL('file://' + __dirname + '/' + filename, loadedCallback);
}
exports.gotoView = gotoView;
function gotoURL(url, loadedCallback) {
    win.loadURL(url);
    onViewLoad = loadedCallback;
}
exports.gotoURL = gotoURL;
function setDefaultWindow() {
    win.setResizable(false);
    if (win.isMaximized()) {
        win.unmaximize();
    }
    win.setSize(defaultViewWidth, defaultViewHeight);
}
function setEditorWindow(splitView = false) {
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    if (splitView && width >= splitViewMinWidth) {
        win.setPosition(0, 0);
        win.setSize(Math.floor(width / 2), height, true);
    }
    else {
        win.center();
        win.setSize(editorWidth, editorHeight, true);
    }
    win.setMinimumSize(editorMinWidth, editorMinHeight);
    win.setResizable(true);
}
function invokeMinecraftURI() {
    // Only interested in this URI if Minecraft opened us via URI
    if (wasURILaunched === true) {
        companionApp_1.getApp().debugLog('Invoking minecraft URI...');
        electron_1.shell.openExternal(minecraftURI + companionApp_1.getApp().wsPort.toString());
    }
}
class CodeConnection {
    onCommandResponse(response) {
    }
    onCommandError(error) {
        if (error.errorCode == commandError_1.ErrorCode.FailedToBind) {
            gotoErrorView(`${error.errorMessage}. Is another instance of this app running? Please exit the app.`);
        }
    }
    onConnectionEstablished() {
    }
    onListening() {
        invokeMinecraftURI();
    }
    onConnectionValidated(error) {
        switch (error) {
            case commandError_1.ConnectionError.None:
                connectedViewController.init();
                break;
            case commandError_1.ConnectionError.GetInfoError:
                companionApp_1.getApp().debugLog('Error validating connection');
                break;
            case commandError_1.ConnectionError.ThisOutOfDate:
                gotoErrorView('Please update this application to the latest version.');
                break;
            case commandError_1.ConnectionError.MinecraftOutOfDate:
                gotoErrorView('Please update Minecraft: Education Edition to the latest version.');
                break;
        }
    }
    onClosed() {
        gotoWaitingView();
    }
}
let cc;
function restBindError(error) {
    if (error.errorCode == commandError_1.ErrorCode.FailedToBind) {
        gotoErrorView(`${error.errorMessage}. Is another instance of this app running? Please exit the app.`);
    }
}
function createBrowserWindow(url, splitView = false) {
    let result;
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    if (splitView && width >= splitViewMinWidth) {
        result = new electron_1.BrowserWindow({
            center: false,
            height,
            width: Math.floor(width / 2),
            x: 0,
            y: 0
        });
    }
    else {
        result = new electron_1.BrowserWindow({ width: editorWidth, height: editorHeight });
    }
    result.setMenu(null);
    result.loadURL(url);
    result.webContents.on("did-stop-loading", function () {
        if (openDevTools) {
            result.webContents.openDevTools();
        }
    });
    return result;
}
exports.createBrowserWindow = createBrowserWindow;
function createWindow() {
    // Create debug window first so it's under the main one
    if (!sharedConstants_1.IsProduction && sharedConstants_1.ShowDebugWindow) {
        companionApp_1.getApp().createDebugWindow();
    }
    win = new electron_1.BrowserWindow({ width: defaultViewWidth, height: defaultViewHeight, resizable: false, frame: false });
    // Disable file, edit, etc. menu
    win.setMenu(null);
    gotoWaitingView();
    win.webContents.on('did-finish-load', (event, args) => {
        if (onViewLoad != null) {
            onViewLoad();
        }
        if (openDevTools) {
            win.webContents.openDevTools({ mode: 'detach' });
            const hrtimeDiff = process.hrtime(startupTime);
            const secondsDiff = hrtimeDiff[0] + hrtimeDiff[1] / 1e9;
            const perfMsg = `console.log("Total time to display window from app launch: ${secondsDiff}");`;
            win.webContents.executeJavaScript(perfMsg);
        }
    });
    win.on("closed", () => {
        win = null;
    });
    cc = new CodeConnection();
    companionApp_1.getApp().initCommandLayer({ companionListener: cc, connectionInitializer: new connectionInitializer_1.ConnectionInitializer() });
    // When player leaves level, disconnect
    companionApp_1.getApp().commandGlue.addEventSubscription('MultiplayerRoundEnd', (response) => {
        companionApp_1.getApp().debugLog('User left level, aborting connection');
        companionApp_1.getApp().server.closeConnection();
    });
    restServer_1.restListenOn(restPort, restBindError);
}
// Needs to be before ready, as this is emitted early
electron_1.app.on('open-url', (event, url) => {
    if (url != null && url.includes(launchURI)) {
        setURILaunched();
        // If we already created our window we can do this now, otherwise wait until window creation and invocation will happen then
        if (win != null) {
            invokeMinecraftURI();
        }
    }
});
electron_1.app.on("ready", createWindow);
electron_1.app.on("window-all-closed", () => {
    let timeClosedMS = Date.now();
    let msToSeconds = 1 / 1000;
    // Make sure we finish sending the telemetry before quitting. Out of luck for force quit I guess
    companionApp_1.getApp().telemetry.fireClosed((timeClosedMS - timeCreatedMS) * msToSeconds, () => {
        electron_1.app.quit();
    });
});
electron_1.app.on("activate", () => {
    if (win === null)
        createWindow();
});
if (!electron_1.app.isDefaultProtocolClient(launchURI)) {
    // Point at electron and supply main.js file. Works both for packaged and vscode builds
    electron_1.app.setAsDefaultProtocolClient(launchURI, electron_1.app.getPath('exe'), [__dirname + '/main.js']);
}
// On windows, the URI that invoked this is provided here. On mac you need to catch it through open-url
// argv is pretty inconsistent, so search through all of them for uri
for (let k in process.argv) {
    // String, but typescript doesn't know about includes
    let arg = process.argv[k];
    if (arg != null && arg.includes(launchURI)) {
        setURILaunched();
        break;
    }
}
// Enfore single instance
let isSecondaryInstance = electron_1.app.makeSingleInstance(() => {
    win.restore();
    win.focus();
});
if (isSecondaryInstance) {
    // If minecraft launched a second instance, they want to connect, so close this secondary one, but tell Minecraft there's an instance that can connect, which is the other one
    invokeMinecraftURI();
    electron_1.app.quit();
}
electron_1.ipcMain.on('exit', (args) => {
    if (win != null) {
        win.close();
    }
    // We don't want debug window to keep the program alive
    companionApp_1.getApp().closeDebugWindow();
});
electron_1.ipcMain.on('minimize', (args) => {
    if (win != null) {
        win.minimize();
    }
});
electron_1.ipcMain.on('sendToMinecraft', (event, command) => {
    companionApp_1.getApp().debugLog(`running command ${command}`);
    companionApp_1.getApp().server.sendText(command);
});
electron_1.ipcMain.on('setRawListening', (event, shouldListen) => {
    companionApp_1.getApp().setRawSocketListener(shouldListen ? (message) => {
        if (win && connectedViewController.getIsHostingEditor()) {
            win.webContents.send('responseFromMinecraft', message);
        }
        else {
            // If window is gone, also get rid of listener
            companionApp_1.getApp().setRawSocketListener(null);
        }
    } : null);
});
electron_1.ipcMain.on('exitSameWindowEditor', (event, params) => {
    companionApp_1.getApp().setRawSocketListener(null);
    connectedViewController.init();
    if (params.isEditorLoaded) {
        win.center();
    }
});
electron_1.ipcMain.on('sameWindowEditorLoaded', (event, params) => {
    setEditorWindow(params.splitView);
});

electron_1.app.on('ready', (event, params) => {
    const { Menu } = electron_1;
    const template = [
        {
            label: 'Application',
            submenu: [
                { label: 'About Code Connection for Minecraft', role: 'about' },
                { type: 'separator' },
                { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
            ]
        }, {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
                { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});
//# sourceMappingURL=main.js.map
