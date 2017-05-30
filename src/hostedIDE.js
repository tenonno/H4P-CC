"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const constants = require("./base/sharedConstants.js");
const url = require("url");
const minecraftApi = require("./minecraftAPI");
const mcButton_1 = require("./mcButton");
const editor = document.getElementById('Editor');
const backButton = document.getElementById('BackButton');
const exitButton = document.getElementById('ExitButton');
const maxButton = document.getElementById('MaximizeButton');
const minButton = document.getElementById('MinimizeButton');
const body = document.getElementsByTagName('body')[0];
const title = document.getElementById('TitleText');
const headerBar = document.getElementById('Header');
const loadingLabel = document.getElementById('LoadingLabel');
const win = getBrowserWindow();
const shouldOpenDevTools = 'shouldOpenDevTools';
const internetMsg = 'Please ensure you are connected to the internet and try again.';
let isEditorLoaded = false;
let editorName;
function setupEditorName(name) {
    editorName = name;
    document.title = constants.ApplicationName;
    title.textContent = `${constants.ApplicationName} - ${editorName}`;
    loadingLabel.textContent = `Loading ${editorName}...`;
}
exports.setupEditorName = setupEditorName;
/**
 * Gets the Electron browser window hosting this page. Looks through all browser windows to find the one whose URL
 * matches that of the current web page.
 */
function getBrowserWindow() {
    return electron_1.remote.BrowserWindow.getAllWindows().find((w) => {
        if (w.getURL() === window.location.href) {
            return true;
        }
        return false;
    });
}
function onUnmaximized() {
    maxButton.classList.remove('isMaximized');
}
/**
 * Setup handling of the back, minimize, maximize, and close buttons. Naming of window buttons must match the ID
 * selectors at the top of this file.
 */
function setupNavigationBar() {
    mcButton_1.setupMCButtonEvents(backButton);
    backButton.addEventListener('click', (event) => {
        const msg = {
            isEditorLoaded
        };
        win.removeListener('unmaximize', onUnmaximized);
        body.classList.remove('hideBackground');
        title.classList.remove('absolute');
        headerBar.classList.add('hidden');
        if (editor != null) {
            editor.classList.add('hide');
        }
        maxButton.classList.add('hidden');
        minButton.classList.remove('shiftLeft');
        electron_1.ipcRenderer.send('exitSameWindowEditor', msg);
    });
    mcButton_1.setupMCButtonEvents(minButton);
    minButton.addEventListener('click', (event) => {
        win.minimize();
    });
    win.on('unmaximize', onUnmaximized);
    mcButton_1.setupMCButtonEvents(maxButton);
    maxButton.addEventListener('click', (event) => {
        if (win.isMaximized()) {
            if (process.platform === "darwin") {
                win.setResizable(true);
                win.setMovable(true);
            }
            win.unmaximize();
        }
        else {
            maxButton.classList.add('isMaximized');
            // HACK: We can remove these 2 lines when we update to the electron version
            // that supports fullscreen that doesn't cover taskbar
            win.setMinimumSize(0, 0);
            win.setResizable(true);
            win.maximize();
            // Mac os doesn't support unmaximize through mouse drag
            // so lock the movement of window
            if (process.platform === "darwin") {
                win.setResizable(false);
                win.setMovable(false);
            }
        }
    });
    mcButton_1.setupMCButtonEvents(exitButton);
    exitButton.addEventListener('click', (event) => {
        electron_1.ipcRenderer.send('exit');
    });
}
exports.setupNavigationBar = setupNavigationBar;
function editorTransitionCallback() {
    const msg = {
        splitView: true
    };
    isEditorLoaded = true;
    electron_1.ipcRenderer.send('sameWindowEditorLoaded', msg);
    loadingLabel.classList.add('hidden');
    body.classList.add('hideBackground');
    headerBar.classList.remove('hidden');
    title.classList.add('absolute');
    window.setTimeout(() => {
        // Make editor appearance a bit smoother by giving the window some time to resize.
        editor.classList.remove('hide');
        minButton.classList.add('shiftLeft');
        maxButton.classList.remove('hidden');
    }, 300);
    if (editor[shouldOpenDevTools]) {
        editor.openDevTools();
    }
    // Don't call this twice, since if they click on a link this will be called again but we don't want to move the
    // window around
    editor.removeEventListener('did-finish-load', editorTransitionCallback);
}
function editorLoadErrorCallback() {
    // In case of load error, the did-finish-load event is still fired, so remove the handler
    editor.removeEventListener('did-finish-load', editorTransitionCallback);
    if (editorName) {
        loadingLabel.textContent = `Error loading ${editorName}. ${internetMsg}`;
    }
    else {
        loadingLabel.textContent = `Error loading the editor. ${internetMsg}`;
    }
}
function setupEditorTransition(allowDevTools = false) {
    if (allowDevTools) {
        // If the current editor allows dev tools to be open, and the main process passed 'openDevTools=true' as a
        // querystring in the browser window URL, open the dev tools for the editor webview
        const parsedUrl = url.parse(window.location.href, true);
        const openDevTools = parsedUrl.query['openDevTools'];
        editor[shouldOpenDevTools] = openDevTools;
    }
    editor.addEventListener('did-finish-load', editorTransitionCallback);
    editor.addEventListener('did-fail-load', editorLoadErrorCallback);
}
exports.setupEditorTransition = setupEditorTransition;
function allowAlternateStartPage() {
    electron_1.ipcRenderer.on('openInWebview', (event, url) => {
        editor.loadURL(url);
    });
}
exports.allowAlternateStartPage = allowAlternateStartPage;
// Setup ipc handlers that pass information between main and the 'editor' webview
function setupIPCPipe() {
    // Set up Minecraft communication
    // 'ipc-message' is the built-in electron event for receiving messages from the guest page running inside the webview.
    // The guest page inside the webview can use ipcRenderer.sendToHost() to generate this event.
    editor.addEventListener('ipc-message', (event) => {
        if (event.channel === 'sendToApp') {
            // Forward messages from pxt-core to Minecraft.
            const minecraftMessage = event.args[0];
            minecraftApi.sendToMinecraft(JSON.stringify(minecraftMessage));
        }
        else {
            console.log(`Ignoring editor IPC message: ${event.channel}`);
        }
    });
    minecraftApi.setMinecraftListener((response) => {
        // Forward responses to the webview.
        editor.send('responseFromApp', response);
    });
}
exports.setupIPCPipe = setupIPCPipe;
//# sourceMappingURL=hostedIDE.js.map