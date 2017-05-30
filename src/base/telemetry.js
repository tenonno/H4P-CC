"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sharedConstants_1 = require("./sharedConstants");
const uuid = require("uuid");
const HTTPS = require("https");
const companionApp_1 = require("./companionApp");
class Telemetry {
    constructor() {
        this.maelstromHost = sharedConstants_1.IsProduction ? 'minecraftprod.rtep.msgamestudios.com' :
            'rtep.int.msgamestudios.com';
        this.maelstromPath = sharedConstants_1.IsProduction ? '/tenants/minecraftprod/routes/edu' :
            '/tenants/minecraftint/routes/test';
        this.maelstromContentType = 'application/ms-maelstrom.v3+json;type=eventbatch;charset=utf-8';
        this.appId = 2;
        this.sessionId = uuid.v4();
        this.sequenceId = 0;
        this.pathWithSession = this.maelstromPath + '/' + this.sessionId;
    }
    fireClosed(activeSeconds, callback) {
        this.fireProps('CompanionAppEnd', {
            'ActiveSeconds': Math.floor(activeSeconds)
        }, callback);
    }
    fireEditorButtonPressed(buttonType, url) {
        this.fireProps('EditorButtonPressed', {
            'ButtonType': buttonType,
            // == null is null or undefined, make it undefined so 'ButtonUrl' isn't written to the json
            'ButtonUrl': url == null ? undefined : encodeURI(url)
        }, null);
    }
    fireProps(eventName, properties, callback) {
        // Tack on base properties
        properties['PlayerSessionID'] = this.playerSessionid;
        properties['ClientID'] = this.clientId;
        properties['Plat'] = process.platform.toString();
        properties['Build'] = sharedConstants_1.Build;
        properties['CompanionAppId'] = this.appId;
        this.fireBody({
            'EventName': eventName,
            'Properties': properties
        }, callback);
    }
    fireBody(body, callback) {
        this.fireObject({
            'events': [{
                    'body': body,
                    'sequenceId': this.sequenceId,
                    'timestampUtc': this.getTimestamp(),
                    'typeId': this.hashCode(body.EventName)
                }]
        }, callback);
    }
    fireObject(obj, callback) {
        let toFire = JSON.stringify(obj);
        let options = {
            'method': 'POST',
            'hostname': this.maelstromHost,
            'path': this.pathWithSession,
            'headers': {
                'Content-Type': this.maelstromContentType,
                'Content-Length': toFire.length
            }
        };
        let request = HTTPS.request(options);
        request.on('error', (e) => {
            companionApp_1.getApp().debugLog('Error firing telemetry event: ' + e.toString());
            if (callback) {
                callback();
            }
        });
        request.write(toFire);
        if (callback != null) {
            request.on('finish', callback);
        }
        request.end();
    }
    getTimestamp() {
        let now = new Date();
        // Output to match Minecraft's use of strftime(%Y-%m-%dT%X) which looks like 2017-02-11T00:59:34
        let year = now.getUTCFullYear().toString();
        let month = (now.getUTCMonth() + 1).toString();
        let day = now.getUTCDate().toString();
        let hour = now.getUTCHours().toString();
        let minute = now.getUTCMinutes().toString();
        let second = now.getUTCSeconds().toString();
        return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    }
    // Exactly what minecraft does for consistency
    hashCode(s) {
        let len = s.length;
        let hash = 0;
        for (let i = 0; i < len; ++i) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
        }
        // Make hash unsigned
        hash = hash >>> 0;
        return hash;
    }
    round(num) {
        return Number(num.toFixed(2));
    }
}
exports.Telemetry = Telemetry;
//# sourceMappingURL=telemetry.js.map