"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const prompt_1 = require("./prompt");
const EscapeException_1 = require("../utils/EscapeException");
class ListPrompt extends prompt_1.default {
    constructor(question) {
        super(question);
    }
    render() {
        let choices;
        if (this._question.choices instanceof Array) {
            choices = this._question.choices.reduce((result, choice) => {
                result[choice] = choice;
                return result;
            }, {});
        }
        else {
            choices = this._question.choices.reduce((result, choice) => {
                result[choice.name] = choice.value;
                return result;
            }, {});
        }
        const options = {
            placeHolder: this._question.message
        };
        return vscode_1.window.showQuickPick(Object.keys(choices), options)
            .then(result => {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            return choices[result];
        });
    }
}
exports.default = ListPrompt;
//# sourceMappingURL=../../../src/out/yo/prompts/list.js.map