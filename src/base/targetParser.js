"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Rule {
    constructor(ruleName, ruleValue, ruleInverted) {
        this.inverted = ruleInverted;
        this.name = ruleName;
        this.value = ruleValue;
    }
}
class Target {
    // Don't parse right away, we parse after putting it in the body to simplify parameter extraction on rest calls
    constructor(targetInput) {
        this.selector = null;
        this.toParse = null;
        this.toParse = targetInput;
    }
    requiredParser() {
        return TargetParser.name;
    }
}
exports.Target = Target;
class TargetParser {
    parse(obj) {
        let target = obj;
        if (target.toParse == null) {
            return target.toParse;
        }
        target.toParse = target.toParse.trim();
        this.parseSelector(target);
        if (target.selector == null) {
            return null;
        }
        // If no selector was specified it must be referring to a character by name
        if (target.selector == TargetParser.noSelector) {
            this.targetByName(target);
            target.toParse = undefined;
            return target;
        }
        // All that's left is an optional list of rules in brackets
        if (target.toParse.length == 0) {
            // Nothing left, user chose not to specify rules
            target.toParse = undefined;
            return target;
        }
        this.parseRules(target);
        // If we failed to parse rules
        if (target.rules == null) {
            return null;
        }
        // Rules successfully parsed. Undefine toParse so it doesn't show up when stringified
        target.toParse = undefined;
        return target;
    }
    targetByName(target) {
        target.rules = [new Rule(TargetParser.defaultRuleName, target.toParse, false)];
        target.selector = TargetParser.defaultSelector;
    }
    parseRules(target) {
        let rules = target.toParse;
        target.rules = null;
        // Make sure rule list is in brackets
        if (rules.length < 2 || rules[0] != '[' || rules[rules.length - 1] != ']') {
            return;
        }
        // Then take off brackes
        rules = rules.substring(1, rules.length - 1);
        target.rules = [];
        // Get array of individual rules, which are key=value pairs
        let ruleList = rules.split(',');
        for (let i = 0; i < ruleList.length; ++i) {
            let rule = ruleList[i];
            let keyValue = rule.split('=');
            // Anything other than key=value is invalid
            if (keyValue.length != 2 || keyValue[0].length == 0 || keyValue[1].length == 0) {
                target.rules = null;
                return;
            }
            let key = keyValue[0];
            let value = keyValue[1];
            // =! is allowed to invert, so first character would be there in split
            let inverted = value[0] == '!';
            // Once we know if it's inverted, take off the !
            if (inverted) {
                value = value.substr(1);
            }
            target.rules.push(new Rule(key, value, inverted));
        }
    }
    parseSelector(target) {
        let selector = target.toParse;
        target.selector = null;
        // This isn't long enough to be anything valid
        if (selector.length < 2) {
            return;
        }
        // If the user didn't use @ they must be specifying a character name
        if (selector[0] != '@') {
            target.selector = TargetParser.noSelector;
            return;
        }
        let typeChar = selector[1].toLowerCase();
        // Slice off '@x' so we continue parsing past it
        target.toParse = target.toParse.slice(2);
        switch (typeChar) {
            case 'p':
                target.selector = 'nearestPlayer';
                break;
            case 'r':
                target.selector = 'randomPlayer';
                break;
            case 'a':
                target.selector = 'allPlayers';
                break;
            case 'e':
                target.selector = 'allEntities';
                break;
        }
    }
}
// If we can't parse a selector or rules, we assume the user specified a player name, same as Minecraft
TargetParser.defaultSelector = 'nearestPlayer';
TargetParser.noSelector = 'none';
TargetParser.defaultRuleName = 'name';
exports.TargetParser = TargetParser;
//# sourceMappingURL=targetParser.js.map