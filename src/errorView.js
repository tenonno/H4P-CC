"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
let errorLabel = document.getElementById('ErrorLabel');
let exitButton = document.getElementById('ExitButton');
const ipcRenderer = electron.ipcRenderer;
electron.ipcRenderer.on('setErrorString', (event, text) => {
    errorLabel.insertAdjacentText('beforeend', text);
});
exitButton.addEventListener('click', (event) => {
    ipcRenderer.send('exit');
});
//# sourceMappingURL=errorView.js.map