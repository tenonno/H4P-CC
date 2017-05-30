"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('./menuBar');
let copyButton = document.getElementById('CopyButton');
let commandLabel = document.getElementById('CommandLabel');
const electron = require("electron");
const mcButton_1 = require("./mcButton");
const ipcRenderer = electron.ipcRenderer;
mcButton_1.setupMCButtonEvents(copyButton);
copyButton.addEventListener('click', (event) => {
    electron.clipboard.writeText(commandLabel.value);
});
ipcRenderer.on('setCommandString', (event, arg) => {
    commandLabel.value = arg;
});
//# sourceMappingURL=waitingView.js.map