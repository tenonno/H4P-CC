"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const mcButton_1 = require("./mcButton");
let exitButton = document.getElementById('ExitButton');
let minButton = document.getElementById('MinimizeButton');
const ipcRenderer = electron.ipcRenderer;
mcButton_1.setupMCButtonEvents(minButton);
mcButton_1.setupMCButtonEvents(exitButton);
minButton.addEventListener('click', (event) => {
    mcButton_1.clearHoverState(minButton);
    ipcRenderer.send('minimize');
});
exitButton.addEventListener('click', (event) => {
    ipcRenderer.send('exit');
});
//# sourceMappingURL=menuBar.js.map