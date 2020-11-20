"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var vscode_1 = require("vscode");
var prompt_1 = require("./prompt");
var EscapeException_1 = require("../utils/EscapeException");
var figures = require('figures');
var CheckboxPrompt = /** @class */ (function (_super) {
    __extends(CheckboxPrompt, _super);
    function CheckboxPrompt(question) {
        var _this = this;
        question.choices = question.choices.map(function (choice) {
            if (typeof choice === 'string') {
                return {
                    name: choice,
                    value: choice
                };
            }
            return choice;
        });
        _this = _super.call(this, question) || this;
        return _this;
    }
    CheckboxPrompt.prototype.render = function () {
        var _this = this;
        var choices = this._question.choices.reduce(function (result, choice) {
            result[(choice.checked === true ? figures.radioOn : figures.radioOff) + " " + choice.name] = choice;
            return result;
        }, {});
        var options = {
            placeHolder: this._question.message
        };
        var quickPickOptions = Object.keys(choices);
        quickPickOptions.push(figures.tick);
        return vscode_1.window.showQuickPick(quickPickOptions, options)
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1["default"]();
            }
            if (result !== figures.tick) {
                choices[result].checked = !choices[result].checked;
                return _this.render();
            }
            return _this._question.choices.reduce(function (result, choice) {
                if (choice.checked === true) {
                    result.push(choice.value);
                }
                return result;
            }, []);
        });
    };
    return CheckboxPrompt;
}(prompt_1["default"]));
exports["default"] = CheckboxPrompt;
