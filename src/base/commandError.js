"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["RestParseFail"] = 0] = "RestParseFail";
    ErrorCode[ErrorCode["TargetParseFail"] = 1] = "TargetParseFail";
    ErrorCode[ErrorCode["NoConnection"] = 2] = "NoConnection";
    ErrorCode[ErrorCode["FailedToSendCommand"] = 3] = "FailedToSendCommand";
    ErrorCode[ErrorCode["FailedToParseCommandResponse"] = 4] = "FailedToParseCommandResponse";
    ErrorCode[ErrorCode["FailedCommandExecution"] = 5] = "FailedCommandExecution";
    ErrorCode[ErrorCode["CancelledCommand"] = 6] = "CancelledCommand";
    ErrorCode[ErrorCode["InvalidURL"] = 7] = "InvalidURL";
    ErrorCode[ErrorCode["FailedToBind"] = 8] = "FailedToBind";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class CommandError {
    constructor(code) {
        this.errorCode = code;
        switch (code) {
            case ErrorCode.RestParseFail:
                this.errorMessage = 'Malformed REST query';
                break;
            case ErrorCode.TargetParseFail:
                this.errorMessage = 'Failed to parse input target selector';
                break;
            case ErrorCode.NoConnection:
                this.errorMessage = 'No Websocket connection';
                break;
            case ErrorCode.FailedToSendCommand:
                this.errorMessage = 'Websocket error trying to send command';
                break;
            case ErrorCode.FailedToParseCommandResponse:
                this.errorMessage = 'Failed to parse websocket response for command';
                break;
            case ErrorCode.FailedCommandExecution:
                this.errorMessage = 'Minecraft side command execution failed';
                break;
            case ErrorCode.CancelledCommand:
                this.errorMessage = 'Cancelled execution of command in favor of new one';
                break;
            case ErrorCode.InvalidURL:
                this.errorMessage = 'Invalid url: ';
                break;
            case ErrorCode.FailedToBind:
                this.errorMessage = 'Failed to bind to port: ';
                break;
            default: console.assert(false, 'Unhandled error code');
        }
    }
}
exports.CommandError = CommandError;
var ConnectionError;
(function (ConnectionError) {
    ConnectionError[ConnectionError["None"] = 0] = "None";
    ConnectionError[ConnectionError["GetInfoError"] = 1] = "GetInfoError";
    ConnectionError[ConnectionError["ThisOutOfDate"] = 2] = "ThisOutOfDate";
    ConnectionError[ConnectionError["MinecraftOutOfDate"] = 3] = "MinecraftOutOfDate";
})(ConnectionError = exports.ConnectionError || (exports.ConnectionError = {}));
//# sourceMappingURL=commandError.js.map