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
var ExpandPrompt = /** @class */ (function (_super) {
    __extends(ExpandPrompt, _super);
    function ExpandPrompt(question) {
        return _super.call(this, question) || this;
    }
    ExpandPrompt.prototype.render = function () {
        var choices = this._question.choices.reduce(function (result, choice) {
            result[choice.name] = choice.value;
            return result;
        }, {});
        var options = {
            placeHolder: this._question.message
        };
        return vscode_1.window.showQuickPick(Object.keys(choices), options)
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1["default"]();
            }
            return choices[result] || false;
        });
    };
    return ExpandPrompt;
}(prompt_1["default"]));
exports["default"] = ExpandPrompt;