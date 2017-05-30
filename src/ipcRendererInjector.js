/*
When used in the "preload" attribute of an Electron <webview> tag, injects the ipcRenderer object in the window
scope for use by the guest page. This lets the guest page inside the <webview> communicate with the Electron main
process without exposing require() to the guest page, which would allow the guest page to require native NodeJS APIs
(such as the file system module).

Example use: <webview src="http://..." preload="./ipcRendererInjector.js"></webview>
*/
window.ipcRenderer = require("electron").ipcRenderer;
//# sourceMappingURL=ipcRendererInjector.js.map