"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandError_1 = require("./commandError");
const targetParser_1 = require("./targetParser");
const blockPosParser_1 = require("./blockPosParser");
const rotationParser_1 = require("./rotationParser");
const optionalParser_1 = require("./optionalParser");
const numParser_1 = require("./numParser");
const iParser_1 = require("./iParser");
const companionApp_1 = require("./companionApp");
// Interface for easily sending and mapping callbacks to commands and events.
// Request ids are used to call the given callback for a command that was sent, meaning
// that this is not limited to one command at a time.
// If an error occurs trying to send the command, the callback is called with CommandError and null response
// If an error occurs in the response, like the command failed, the callback is called with a CommandError and the response
// If all goes well, the result will be passed back in the callback, and it's up to the caller to parse it as they wish
class CommandGlue {
    constructor(server) {
        // Requestid to callback
        this.pendingCommands = {};
        // OptionalParser should be first so subsequent parsers can handle an optional parsable type
        this.parsers = [new optionalParser_1.OptionalParser(), new targetParser_1.TargetParser(), new blockPosParser_1.BlockPosParser(), new numParser_1.NumParser(), new rotationParser_1.RotationParser()];
        this.optionalParser = this.parsers[0];
        this.eventSubscriptions = {};
        this.server = server;
    }
    addEventSubscription(event, callback) {
        this.eventSubscriptions[event] = callback;
        // Subscriptions are added on connection, but if we're already connected, need to add it now
        if (companionApp_1.getApp().server.isConnected()) {
            this.server.subscribeToEvent(event, callback);
        }
    }
    onConnected() {
        this.clearCommand();
        for (let eventName in this.eventSubscriptions) {
            this.server.subscribeToEvent(eventName, this.eventSubscriptions[eventName]);
        }
    }
    getRequestId(command) {
        if (command != null) {
            let header = command.header;
            if (header != null) {
                return header.requestId;
            }
        }
        return null;
    }
    onCommandComplete(response) {
        companionApp_1.getApp().debugLog(`Command complete: ${JSON.stringify(response)}`);
        let id = this.getRequestId(response);
        if (id != null) {
            let callback = this.pendingCommands[id];
            if (callback != null) {
                callback(null, response);
                this.pendingCommands[id] = undefined;
                return;
            }
        }
        companionApp_1.getApp().debugLog('Failed to map response to callback');
    }
    onClosed() {
        this.clearCommand();
    }
    clearCommand() {
        this.pendingCommands = {};
    }
    onCommandResponse(response) {
        companionApp_1.getApp().debugLog('Command response');
        if (response.body == undefined) {
            companionApp_1.getApp().debugLog('Missing body field in instant command response');
        }
        else {
            this.onCommandComplete(response);
        }
    }
    // From ICommandListener
    onError(error, response) {
        companionApp_1.getApp().debugLog(`Command failed: ${JSON.stringify(response)}`);
        let id = this.getRequestId(response);
        if (id != null) {
            let callback = this.pendingCommands[id];
            if (callback) {
                callback(error, response);
                this.pendingCommands[id] = undefined;
                return;
            }
        }
        companionApp_1.getApp().debugLog('Failed to map error response to callback');
    }
    validateInputs(commandInput) {
        let missingKeys = [];
        let failedParseKeys = [];
        let inputs = Object.keys(commandInput);
        // Look for missing inputs and if there are make a comma separated list in expectedKeys like 'Expected: direction, slotnum'
        inputs.forEach((input) => {
            let value = commandInput[input];
            let optional = iParser_1.canParse(this.optionalParser, value);
            // See if this is a parsable type, if it's a plain type nothing will happen
            for (let i = 0; i < this.parsers.length; ++i) {
                let parser = this.parsers[i];
                if (iParser_1.canParse(parser, value)) {
                    value = parser.parse(value);
                }
            }
            // Undefined means parameter wasn't supplied, which is invalid unless it's optional
            if (value === undefined && optional == false) {
                missingKeys.push(input);
            }
            else if (value === null) {
                failedParseKeys.push(input);
            }
            // Apply parsed input, or self assign if nothing was parsed. If this was optional input this will assign to undefined, removing the key from the final json
            commandInput[input] = value;
        });
        let error = null;
        if (missingKeys.length != 0) {
            error = new commandError_1.CommandError(commandError_1.ErrorCode.RestParseFail);
            error.errorMessage += `\nMissing: ${missingKeys.join(', ')}`;
        }
        if (failedParseKeys.length != 0) {
            error = new commandError_1.CommandError(commandError_1.ErrorCode.TargetParseFail);
            error.errorMessage += `\nFailed to Parse: ${failedParseKeys.join(', ')}`;
        }
        return error;
    }
    runCommand(commandName, commandInput, response, commandOverload = 'default', version = 1) {
        let validateError = this.validateInputs(commandInput);
        if (validateError != null) {
            response(validateError, null);
            return;
        }
        companionApp_1.getApp().debugLog(`Running command '${commandName}'`);
        if (!this.server.isConnected()) {
            response(new commandError_1.CommandError(commandError_1.ErrorCode.NoConnection), null);
            return;
        }
        let id = this.server.sendCommand(commandInput, commandName, commandOverload, version);
        this.pendingCommands[id] = response;
    }
}
exports.CommandGlue = CommandGlue;
//# sourceMappingURL=commandGlue.js.map