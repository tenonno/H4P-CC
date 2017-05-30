'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
const companionApp_1 = require("./base/companionApp");
const targetParser_1 = require("./base/targetParser");
const blockPosParser_1 = require("./base/blockPosParser");
const optionalParser_1 = require("./base/optionalParser");
const rotationParser_1 = require("./base/rotationParser");
const numParser_1 = require("./base/numParser");
const commandError_1 = require("./base/commandError");
exports.RestServer = Express();
const allowedOrigin = ['http://scratchx.org', 'http://snap.berkeley.edu', 'http://www.tynker.com'];
//-------------------------------------------------------------------------------------------------------------------
// REST interface. Each call requires a connection id (cid) and REST key (rk) which is provided when you connect to the websocket server.
//-------------------------------------------------------------------------------------------------------------------
function restListenOn(port, errorCallback) {
    let server = exports.RestServer.listen(port, function () {
        companionApp_1.getApp().debugLog(`REST server listening at ${companionApp_1.getApp().getIPAddress()}:${port}`);
    });
    server.on('error', (err) => {
        let ce = new commandError_1.CommandError(commandError_1.ErrorCode.FailedToBind);
        ce.errorMessage += String(port);
        errorCallback(ce);
    });
    companionApp_1.getApp().commandGlue.addEventSubscription('AgentCommand', (response) => {
        companionApp_1.getApp().debugLog('Agent Response');
        // Strip out all the unrelated stuff and only return relevant subset
        if (response.body == undefined || response.body.properties == undefined || response.body.properties.Result == undefined) {
            companionApp_1.getApp().debugLog('Missing result field in Agent Event response');
            onCommandResponse(new commandError_1.CommandError(commandError_1.ErrorCode.FailedToParseCommandResponse), null);
        }
        else if (curResponse != null) {
            curResponseSend(response.body.properties.Result);
        }
        else {
            companionApp_1.getApp().debugLog('Received unexpected Agent response');
        }
    });
}
exports.restListenOn = restListenOn;
exports.RestServer.all('/*', function (req, res, next) {
    // Allow cross domain communication with anyone. None of our messages contain sensitive information
    res.header('Access-Control-Allow-Origin', req.headers['origin']);
    // ajax call only
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Methods', 'GET');
    next();
});
exports.RestServer.get('/', function (req, res) {
    // hit home page. Do nothing.
});
exports.RestServer.get('/connected', function (req, res) {
    res.json(companionApp_1.getApp().getCommandGlue().server.isConnected());
});
// Any null or undefined values will be caught by minecraft when processing command input
exports.RestServer.get('/move', function (req, res) {
    runCommand('move', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/turn', function (req, res) {
    runCommand('turn', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/place', function (req, res) {
    runCommand('place', { 'slotNum': new numParser_1.Num(req.query.slotNum), 'direction': req.query.direction }, res);
});
exports.RestServer.get('/attack', function (req, res) {
    runCommand('attack', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/destroy', function (req, res) {
    runCommand('destroy', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/till', function (req, res) {
    runCommand('till', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/collect', function (req, res) {
    runCommand('collect', { 'item': req.query.item }, res);
});
exports.RestServer.get('/drop', function (req, res) {
    runCommand('drop', { 'slotNum': new numParser_1.Num(req.query.slotNum), 'quantity': new numParser_1.Num(req.query.quantity), 'direction': req.query.direction }, res);
});
exports.RestServer.get('/dropall', function (req, res) {
    runCommand('dropall', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/detect', function (req, res) {
    runCommand('detect', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/inspect', function (req, res) {
    runCommand('inspect', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/inspectdata', function (req, res) {
    runCommand('inspectdata', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/detectredstone', function (req, res) {
    runCommand('detectredstone', { 'direction': req.query.direction }, res);
});
exports.RestServer.get('/activateredstone', function (req, res) {
    runCommand('activateredstone', { 'type': req.query.type, 'direction': req.query.direction }, res);
});
exports.RestServer.get('/getitemdetail', function (req, res) {
    runCommand('getitemdetail', { 'slotNum': new numParser_1.Num(req.query.slotNum) }, res);
});
exports.RestServer.get('/getitemspace', function (req, res) {
    runCommand('getitemspace', { 'slotNum': new numParser_1.Num(req.query.slotNum) }, res);
});
exports.RestServer.get('/getitemcount', function (req, res) {
    runCommand('getitemcount', { 'slotNum': new numParser_1.Num(req.query.slotNum) }, res);
});
exports.RestServer.get('/transfer', function (req, res) {
    runCommand('transfer', { 'srcSlotNum': new numParser_1.Num(req.query.srcSlotNum), 'quantity': new numParser_1.Num(req.query.quantity), 'dstSlotNum': new numParser_1.Num(req.query.dstSlotNum) }, res);
});
exports.RestServer.get('/tptoplayer', function (req, res) {
    runCommand('tpagent', {}, res, 'default', true);
});
exports.RestServer.get('/tptargettotarget', function (req, res) {
    runCommand('tp', { 'victim': new targetParser_1.Target(req.query.victim), 'destination': new targetParser_1.Target(req.query.destination), 'y-rot': new optionalParser_1.Optional(new rotationParser_1.Rotation(req.query.yrot)), 'x-rot': new optionalParser_1.Optional(new rotationParser_1.Rotation(req.query.xrot)) }, res, 'targetToTarget', true, 2);
});
exports.RestServer.get('/tptargettopos', function (req, res) {
    runCommand('tp', { 'victim': new targetParser_1.Target(req.query.victim), 'destination': new blockPosParser_1.BlockPos(req.query.destination), 'y-rot': new optionalParser_1.Optional(new rotationParser_1.Rotation(req.query.yrot)), 'x-rot': new optionalParser_1.Optional(new rotationParser_1.Rotation(req.query.xrot)) }, res, 'targetToPos', true, 2);
});
exports.RestServer.get('/weather', function (req, res) {
    runCommand('weather', { 'type': req.query.type, 'duration': new optionalParser_1.Optional(new numParser_1.Num(req.query.duration)) }, res, 'default', true);
});
exports.RestServer.get('/executedetect', function (req, res) {
    runCommand('execute', { 'origin': new targetParser_1.Target(req.query.origin), 'position': new blockPosParser_1.BlockPos(req.query.position), 'detect': 'detect', 'detectPos': new blockPosParser_1.BlockPos(req.query.detectPos), 'detectBlock': req.query.detectBlock, 'detectData': new numParser_1.Num(req.query.detectData), 'command': req.query.command }, res, 'detect', true);
});
exports.RestServer.get('/executeasother', function (req, res) {
    runCommand('execute', { 'origin': new targetParser_1.Target(req.query.origin), 'position': new blockPosParser_1.BlockPos(req.query.position), 'command': req.query.command }, res, 'asOther', true);
});
exports.RestServer.get('/kill', function (req, res) {
    runCommand('kill', { 'target': new optionalParser_1.Optional(new targetParser_1.Target(req.query.target)) }, res, 'default', true);
});
exports.RestServer.get('/fill', function (req, res) {
    runCommand('fill', { 'from': new blockPosParser_1.BlockPos(req.query.from), 'to': new blockPosParser_1.BlockPos(req.query.to), 'tileName': req.query.tileName, 'tileData': new optionalParser_1.Optional(new numParser_1.Num(req.query.tileData)), 'oldBlockHandling': new optionalParser_1.Optional(req.query.oldBlockHandling), 'replaceTileName': new optionalParser_1.Optional(req.query.replaceTileName), 'replaceDataValue': new optionalParser_1.Optional(new numParser_1.Num(req.query.replaceDataValue)) }, res, 'byName', true);
});
exports.RestServer.get('/give', function (req, res) {
    runCommand('give', { 'player': new targetParser_1.Target(req.query.player), 'itemName': req.query.itemName, 'amount': new optionalParser_1.Optional(new numParser_1.Num(req.query.amount)), 'data': new optionalParser_1.Optional(new numParser_1.Num(req.query.data)) }, res, 'byName', true);
});
exports.RestServer.get('/timesetbynumber', function (req, res) {
    runCommand('time set', { 'time': new numParser_1.Num(req.query.time) }, res, 'byNumber', true);
});
exports.RestServer.get('/timesetbyname', function (req, res) {
    runCommand('time set', { 'time': req.query.time }, res, 'byName', true);
});
exports.RestServer.get('/setblock', function (req, res) {
    runCommand('setblock', { 'position': new blockPosParser_1.BlockPos(req.query.position), 'tileName': req.query.tileName, 'tileData': new optionalParser_1.Optional(new numParser_1.Num(req.query.tileData)), 'oldBlockHandling': new optionalParser_1.Optional(req.query.oldBlockHandling) }, res, 'default', true);
});
exports.RestServer.get('/testforblock', function (req, res) {
    runCommand('testforblock', { 'position': new blockPosParser_1.BlockPos(req.query.position), 'tileName': req.query.tileName, 'dataValue': new optionalParser_1.Optional(new numParser_1.Num(req.query.dataValue)) }, res, 'default', true);
});
exports.RestServer.get('/testforblocks', function (req, res) {
    runCommand('testforblocks', { 'begin': new blockPosParser_1.BlockPos(req.query.begin), 'end': new blockPosParser_1.BlockPos(req.query.end), 'destination': new blockPosParser_1.BlockPos(req.query.destination), 'mode': new optionalParser_1.Optional(req.query.mode) }, res, 'default', true);
});
exports.RestServer.get('/summon', function (req, res) {
    runCommand('summon', { 'entityType': req.query.entityType, 'spawnPos': new blockPosParser_1.BlockPos(req.query.spawnPos) }, res, 'default', true);
});
exports.RestServer.get('/clone', function (req, res) {
    runCommand('clone', { 'begin': new blockPosParser_1.BlockPos(req.query.begin), 'end': new blockPosParser_1.BlockPos(req.query.end), 'destination': new blockPosParser_1.BlockPos(req.query.destination), 'maskMode': new optionalParser_1.Optional(req.query.maskMode), 'cloneMode': new optionalParser_1.Optional(req.query.cloneMode), 'tileName': new optionalParser_1.Optional(req.query.tileName), 'tileData': new optionalParser_1.Optional(new numParser_1.Num(req.query.tileData)) }, res, 'default', true);
});
exports.RestServer.use(function (req, res) {
    let ce = new commandError_1.CommandError(commandError_1.ErrorCode.InvalidURL);
    ce.errorMessage += req.url;
    curResponseSend(JSON.stringify(ce));
});
// Command glue isn't bound to one command at a time, but this interface wants to be, so it's tracked here
let curResponse = null;
let isCurCommandInstant = false;
function runCommand(commandName, commandInput, response, commandOverload = 'default', isInstant = false, version = 1) {
    // This shouldn't happen during normal execution of a single program, but it can if the user abruptly restarts it 
    if (curResponse != null) {
        let ce = new commandError_1.CommandError(commandError_1.ErrorCode.CancelledCommand);
        curResponseSend(ce);
    }
    curResponse = response;
    isCurCommandInstant = isInstant;
    companionApp_1.getApp().getCommandGlue().runCommand(commandName, commandInput, onCommandResponse, commandOverload, version);
}
// One will be null: commandError if sucess, else response
function onCommandResponse(commandError, response) {
    if (commandError != null) {
        curResponseSend(commandError);
    }
    else {
        // If we don't expect an event for this type of command, it's done now
        if (isCurCommandInstant) {
            // We don't care about these fields for the REST response, so get rid of them
            response.body.statusCode = undefined;
            response.body.statusMessage = undefined;
            // For instant commands (Non-agent), response result is in body
            curResponseSend(response.body);
        }
    }
}
function clearCommand() {
    curResponse = null;
}
function curResponseSend(response) {
    if (curResponse != null) {
        curResponse.send(JSON.stringify(response));
        clearCommand();
    }
}
//# sourceMappingURL=restServer.js.map