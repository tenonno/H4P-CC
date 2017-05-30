"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('./menuBar');
const electron = require("electron");
const messages_1 = require("./messages");
const editorButton_1 = require("./editorButton");
const fixedEditors = require("./fixedEditors");
const mcButton_1 = require("./mcButton");
let connectedLabel = document.getElementById('ConnectedLabel');
let pxtButton = document.getElementById('PXTButton');
let scratchButton = document.getElementById('ScratchButton');
let tynkerButton = document.getElementById('TynkerButton');
let feelesButton = document.getElementById('FeelesButton');
let customButtons = [document.getElementById('CustomButtonA'), document.getElementById('CustomButtonB')];
let fixedButtons = [pxtButton, scratchButton, tynkerButton, feelesButton];
let editButton = document.getElementById('EditLinksButton');
const ipcRenderer = electron.ipcRenderer;
let inEditMode = false;
const editingColor = new editorButton_1.Color(55, 55, 55);
mcButton_1.setupMCButtonEvents(editButton);
electron.ipcRenderer.on('setConnectedString', (event, text) => {
    connectedLabel.insertAdjacentText('beforeend', text);
});
electron.ipcRenderer.on('setEditorButtons', (event, buttons) => {
    for (let i = 0; i < buttons.length; ++i) {
        let element = customButtons[i];
        let buttonData = buttons[i];
        element.textContent = buttonData.name;
        element.style.visibility = buttonData.active ? 'visible' : 'hidden';
        element.style.backgroundColor = editorButton_1.Color.toStyle(buttonData.color);
        // Add context menu for all buttons that are not the 'Add Service' buttons
        if (buttonData.link != '') {
            element.addEventListener('contextmenu', (event) => {
                if (event.button == 2 && customButtons[i]) {
                    let ctxMenu = electron.remote.Menu.buildFromTemplate([
                        {
                            'label': 'Edit Service',
                            click() { sendCustomClick(true, i); }
                        },
                        {
                            'label': 'Delete Service',
                            click() { deleteButtonContexet(i); }
                        }
                    ]);
                    ctxMenu.popup();
                    // Reset hover state because it'll get stuck otherwise
                    element.classList.remove('hover');
                    element.classList.remove('active');
                }
            });
        }
    }
});
editButton.addEventListener('click', (event) => {
    inEditMode = !inEditMode;
    // Fixed buttons can't be edited, so disable them to indicate this
    fixedButtons.forEach((button) => {
        button.disabled = inEditMode;
    });
    customButtons.forEach((button) => {
        button.style.color = inEditMode ? 'white' : 'black';
        let oldStyle = 'oldBackgroundColor';
        // Store old color so we can go back to it when edit mode is turned off
        if (inEditMode) {
            button[oldStyle] = button.style.backgroundColor;
            button.style.backgroundColor = editorButton_1.Color.toStyle(editingColor);
        }
        else {
            button.style.backgroundColor = button[oldStyle];
        }
    });
});
function sendCustomClick(isEditMode, buttonIndex) {
    ipcRenderer.send('customButtonClick', isEditMode, buttonIndex);
}
function deleteButtonContexet(buttonIndex) {
    sendCustomClick(true, buttonIndex);
    ipcRenderer.send('deleteEditor');
}
for (let i = 0; i < customButtons.length; ++i) {
    let button = customButtons[i];
    button.addEventListener('click', () => {
        sendCustomClick(inEditMode, i);
    });
    mcButton_1.setupMCButtonEvents(button);
}
function openWindowButton(url, button, type, splitView = false) {
    button.addEventListener('click', (event) => {
        const msg = {
            editorType: type,
            windowInfo: {
                splitView
            },
            url,
            buttonType: button.innerText
        };
        ipcRenderer.send('openEditor', msg);
    });
    mcButton_1.setupMCButtonEvents(button);
}
openWindowButton(fixedEditors.Pxt, pxtButton, messages_1.EditorType.SameWindow);
openWindowButton(fixedEditors.Scratch, scratchButton, messages_1.EditorType.External);
openWindowButton(fixedEditors.Tynker, tynkerButton, messages_1.EditorType.SameWindow);
openWindowButton(fixedEditors.Feeles, feelesButton, messages_1.EditorType.SameWindow);
//# sourceMappingURL=connectedView.js.map
