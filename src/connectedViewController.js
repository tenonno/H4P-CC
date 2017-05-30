"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const main_1 = require("./main");
const companionApp_1 = require("./base/companionApp");
const editorButton_1 = require("./editorButton");
const url = require("url");
const messages = require("./messages");
const fs = require("fs");
const fixedEditors = require("./fixedEditors");
class ConnectedViewController {
    constructor() {
        this.editingButtonIndex = -1;
        this.saveFile = `${electron_1.app.getPath('appData')}/${electron_1.app.getName()}/editors.json`;
        // If we have decided we are hosting an editor, so true before the editor finishes loading, and flipped to false before connected view finishes loading
        this.isHostingEditor = false;
        this.loadEditorButtons();
        // Apply so this is ConnectedViewController, not whoever triggered the event. Thanks javascript.
        electron_1.ipcMain.on('customButtonClick', (a, b, c) => this.onCustomButtonClick.apply(this, [a, b, c]));
        electron_1.ipcMain.on('openEditor', (a, b) => this.onOpenEditor.apply(this, [a, b]));
        electron_1.ipcMain.on('backFromEdit', () => this.onBackFromEdit.apply(this));
        electron_1.ipcMain.on('saveEditor', (a, b) => this.onSaveEditor.apply(this, [a, b]));
        electron_1.ipcMain.on('deleteEditor', () => this.onDeleteEditor.apply(this));
    }
    //public
    init() {
        this.gotoConnectedView();
    }
    getIsHostingEditor() {
        return this.isHostingEditor;
    }
    //private
    onBackFromEdit() {
        this.gotoConnectedView();
    }
    onSaveEditor(event, editor) {
        this.saveEditor(this.editingButtonIndex, editor);
        this.editingButtonIndex = -1;
        this.gotoConnectedView();
        this.saveEditorButtons();
    }
    saveEditor(index, editor) {
        if (editor.link == '') {
            return;
        }
        this.editorButtons[this.editingButtonIndex] = editor;
        this.updateActiveStates();
    }
    onDeleteEditor() {
        // Shift everything over with the hole created by the deletion
        for (let i = this.editingButtonIndex; i + 1 < this.editorButtons.length; ++i) {
            this.editorButtons[i] = this.editorButtons[i + 1];
        }
        // Put placehodler editor at the empty slot on the end
        this.editorButtons[this.editorButtons.length - 1] = this.createPlaceholderEditor(false);
        this.editingButtonIndex = -1;
        this.updateActiveStates();
        this.gotoConnectedView();
        this.saveEditorButtons();
    }
    // We always want the element to the right of the last non-empty link to be active so it is an 'Add Service' button
    updateActiveStates() {
        let lastNonEmpty = this.editorButtons.length;
        for (let i = 0; i < this.editorButtons.length; ++i) {
            if (this.editorButtons[i].link == '') {
                lastNonEmpty = i - 1;
                break;
            }
            this.editorButtons[i].active = true;
        }
        let empty = lastNonEmpty + 1;
        if (empty < this.editorButtons.length) {
            this.editorButtons[empty].active = true;
        }
        for (let i = empty + 1; i < this.editorButtons.length; ++i) {
            this.editorButtons[i].active = false;
        }
    }
    onCustomButtonClick(event, inEditMode, buttonIndex) {
        let button = this.editorButtons[buttonIndex];
        // Link is empty if this is an 'Add Service' button
        if (button.link == '' || inEditMode) {
            this.editingButtonIndex = buttonIndex;
            this.gotoEditView();
        }
        else {
            // Mac won't open a url in default browser unless it starts with http://
            let url = button.link.trim();
            if (!url.includes('http')) {
                url = `http://${url}`;
            }
            companionApp_1.getApp().telemetry.fireEditorButtonPressed('Custom', url);
            // Since we self host tynker we want to host their links too in our webview.
            // Pxt doesn't have interesting links and scratch is always external
            if (button.link.includes('tynker')) {
                main_1.gotoURL(fixedEditors.Tynker, () => {
                    main_1.getWindow().webContents.send('openInWebview', url);
                });
            }
            else {
                this.openEditor({
                    editorType: messages.EditorType.External,
                    url: url
                });
            }
        }
    }
    loadEditorButtons() {
        // Fill placeholder buttons in case we don't load successfully
        this.editorButtons = [];
        for (let i = 0; i < 4; ++i) {
            this.editorButtons.push(this.createPlaceholderEditor(false));
        }
        this.editorButtons[0].active = true;
        fs.readFile(this.saveFile, (err, data) => {
            // Something is bad, whatever, we'll use the placeholder values and write over this bad file the next time any button is changed
            if (err != null) {
                return;
            }
            let editors = [];
            try {
                editors = JSON.parse(data.toString('utf8'));
            }
            // If it doesn't parse, the file was somehow corrupted, perhaps the user manually manipulated it?
            // Either way, return now and use the placehoder buttons
            catch (e) {
                return;
            }
            // Validate contents before using them
            for (let i = 0; i < this.editorButtons.length; ++i) {
                let savedButton = editors[i];
                // Should be very rare, but if something is amiss with this object, forget the whole thing
                // Could try to read the rest of them, but this should be so niche that it's not worth the effort
                if (!this.isValidEditor(savedButton)) {
                    break;
                }
                this.editorButtons[i] = savedButton;
            }
        });
    }
    isValidEditor(editor) {
        return editor != null &&
            typeof (editor.active) == 'boolean' &&
            typeof (editor.color) == 'object' &&
            typeof (editor.color.r) == 'number' &&
            typeof (editor.color.g) == 'number' &&
            typeof (editor.color.b) == 'number' &&
            typeof (editor.link) == 'string' &&
            typeof (editor.name) == 'string';
    }
    saveEditorButtons() {
        fs.writeFile(this.saveFile, JSON.stringify(this.editorButtons), () => { });
    }
    gotoEditView() {
        main_1.gotoView('editView.html', () => {
            let editor = this.editorButtons[this.editingButtonIndex];
            if (editor.link == '') {
                editor = new editorButton_1.EditorButton('', '', new editorButton_1.Color(0, 0, 0), true);
            }
            main_1.getWindow().webContents.send('fillEditView', editor);
        });
    }
    gotoConnectedView() {
        this.isHostingEditor = false;
        main_1.gotoView('connectedView.html', () => {
            main_1.getWindow().webContents.send('setConnectedString', companionApp_1.getApp().server.getConnectedIP());
            main_1.getWindow().webContents.send('setEditorButtons', this.editorButtons);
        });
    }
    addDevToolsQueryString(windowUrl) {
        if (windowUrl && windowUrl.indexOf('file://') === 0 && main_1.getShouldOpenDevTools()) {
            const parsedUrl = url.parse(windowUrl, true);
            if (process.platform === "win32" && parsedUrl.host[parsedUrl.host.length - 1] !== ":") {
                // url.parse() removes the ":" of the drive letter on Windows; add it back.
                parsedUrl.host += ':';
            }
            parsedUrl.query['openDevTools'] = true;
            windowUrl = url.format(parsedUrl);
        }
        return windowUrl;
    }
    openEditor(params) {
        params.url = this.addDevToolsQueryString(params.url);
        switch (params.editorType) {
            case messages.EditorType.External:
                electron_1.shell.openExternal(params.url);
                break;
            case messages.EditorType.SameWindow:
                this.isHostingEditor = true;
                main_1.gotoURL(params.url, null);
                break;
        }
    }
    onOpenEditor(event, params) {
        // Providing url for built in buttons doesn't make sense since we alredy know from the type and might be local files like pxt.html
        companionApp_1.getApp().telemetry.fireEditorButtonPressed(params.buttonType, null);
        this.openEditor(params);
    }
    ;
    createPlaceholderEditor(active) {
        return new editorButton_1.EditorButton('Add Service', '', new editorButton_1.Color(255, 255, 255), active);
    }
}
exports.ConnectedViewController = ConnectedViewController;
//# sourceMappingURL=connectedViewController.js.map
