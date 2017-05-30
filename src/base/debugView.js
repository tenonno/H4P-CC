"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
let textBox = document.getElementById('TextBox');
let clearButton = document.getElementById('ClearButton');
const ipcRenderer = electron.ipcRenderer;
electron.ipcRenderer.on('log', (event, text) => {
    textBox.insertAdjacentText('beforeend', text);
    // \n and \r\n in the above text insert don't work for some reason, so BR it is.
    textBox.insertAdjacentHTML('beforeend', '<BR/>');
    // Scroll to bottom
    textBox.scrollTop = textBox.scrollHeight;
});
clearButton.addEventListener('click', (event) => {
    location.reload();
});
//# sourceMappingURL=debugView.js.map