"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let callbacks = {};
let listenerCallback = null;


function sendToMinecraft(message) {

    console.info('→ sendToMinecraft', JSON.parse(message));

    electron_1.ipcRenderer.send('sendToMinecraft', message);
}
exports.sendToMinecraft = sendToMinecraft;



function setMinecraftListener(callback) {
    listenerCallback = callback;
    electron_1.ipcRenderer.send('setRawListening', callback != null);
}
exports.setMinecraftListener = setMinecraftListener;



electron_1.ipcRenderer.on('responseFromMinecraft', (event, message) => {

    console.info('← responseFromMinecraft', JSON.parse(message));

    if (listenerCallback != null) {
        listenerCallback(message);
    }
});
//# sourceMappingURL=minecraftAPI.js.map
