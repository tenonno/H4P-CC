"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('./menuBar');
const electron = require("electron");
const editorButton_1 = require("./editorButton");
const mcButton_1 = require("./mcButton");
const ipcRenderer = electron.ipcRenderer;
let backButton = document.getElementById('BackButton');
let saveButton = document.getElementById('Save');
let deleteButton = document.getElementById('Delete');
let nameInput = document.getElementById('NameInput');
let linkInput = document.getElementById('LinkInput');
let colorInputs = document.getElementsByClassName('colorRadio');
let colorRadios = document.getElementsByName('color');
mcButton_1.setupMCButtonEvents(backButton);
mcButton_1.setupMCButtonEvents(saveButton);
mcButton_1.setupMCButtonEvents(deleteButton);
nameInput.maxLength = editorButton_1.EditorButton.maxNameLength;
const colorAnchorLeft = 55;
const colorAnchorTop = 330;
const colorPadding = 0;
const defaultColorIndex = 9;
let idToColor = {};
let colors = [
    new editorButton_1.Color(255, 0, 10),
    new editorButton_1.Color(255, 156, 0),
    new editorButton_1.Color(252, 255, 0),
    new editorButton_1.Color(0, 255, 18),
    new editorButton_1.Color(0, 246, 255),
    new editorButton_1.Color(0, 0, 255),
    new editorButton_1.Color(162, 0, 255),
    new editorButton_1.Color(255, 0, 156),
    new editorButton_1.Color(198, 198, 198),
    new editorButton_1.Color(255, 255, 255)
];
// Line up all the color buttons and assign colors to them
for (let i = 0; i < colorInputs.length; ++i) {
    let element = colorInputs[i];
    let style = window.getComputedStyle(element);
    // Strip off non-alphanumeric characters and get width int
    let width = Number.parseInt(style.width.replace('px', ''));
    let px = 'px';
    element.style.left = (colorAnchorLeft + i * (width + colorPadding)).toString() + px;
    element.style.top = colorAnchorTop + px;
    element.style.backgroundColor = editorButton_1.Color.toStyle(colors[i]);
    // Since the label has the color but the radio button is checked, get the id the label is for so we can store the color
    idToColor[element.getAttribute('for')] = colors[i];
}
function isValidLink(link) {
    // Don't want to deal with full url validation
    return link.trim() != '';
}
linkInput.addEventListener('input', (event) => {
    // Enable disable save button if the link field is nonempty
    saveButton.disabled = !isValidLink(linkInput.value);
});
backButton.addEventListener('click', (event) => {
    ipcRenderer.send('backFromEdit');
});
saveButton.addEventListener('click', (event) => {
    // Shouldn't be possible not to find the color
    let foundColor = null;
    // Find the checked element and use its id to retrieve the color since the radio button doesn't contain it, its label does
    for (let i = 0; i < colorRadios.length; ++i) {
        let element = colorRadios[i];
        if (element.checked) {
            foundColor = idToColor[element.id];
            break;
        }
    }
    ipcRenderer.send('saveEditor', new editorButton_1.EditorButton(nameInput.value, linkInput.value, foundColor, true));
});
deleteButton.addEventListener('click', (event) => {
    ipcRenderer.send('deleteEditor');
});
ipcRenderer.on('fillEditView', (event, editor) => {
    // If link is empty, this is a new button, so deleting it doesn't make sense
    if (editor.link == '') {
        deleteButton.disabled = true;
    }
    nameInput.value = editor.name;
    linkInput.value = editor.link;
    saveButton.disabled = !isValidLink(linkInput.value);
    let found = false;
    for (let i = 0; i < colors.length; ++i) {
        if (editorButton_1.Color.equals(colors[i], editor.color)) {
            // Id corrseponds to index in color array, so we can use that to get and check it
            document.getElementById(i.toString()).checked = true;
            found = true;
            break;
        }
    }
    // If not found, set deafault
    if (!found) {
        document.getElementById(defaultColorIndex.toString()).checked = true;
    }
});
//# sourceMappingURL=editView.js.map