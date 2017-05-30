"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const url = require("url");
const hostedIDE = require("./hostedIDE");
const editor = document.getElementById('Editor');
hostedIDE.setupEditorName('Microsoft MakeCode');
hostedIDE.setupEditorTransition(/*allowDevTools*/ true);
hostedIDE.setupNavigationBar();
hostedIDE.setupIPCPipe();
// Open any links in an external browser page.
function openInBrowser(event) {
    const currentUrl = url.parse(editor.src);
    const newUrl = url.parse(event.url);
    if (newUrl.host !== currentUrl.host || newUrl.pathname !== currentUrl.pathname) {
        console.log('PXT - Opening external URL: ' + event.url);
        event.preventDefault();
        electron_1.shell.openExternal(event.url);
    }
}
editor.addEventListener('will-navigate', openInBrowser);
editor.addEventListener('new-window', openInBrowser);
//# sourceMappingURL=pxt.js.map