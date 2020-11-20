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
var run_async_1 = require("../utils/run-async");
var figures = require('figures');
var InputPrompt = /** @class */ (function (_super) {
    __extends(InputPrompt, _super);
    function InputPrompt(question, answers) {
        var _this = _super.call(this, question, answers) || this;
        _this._options = {
            prompt: _this._question.message
        };
        return _this;
    }
    InputPrompt.prototype.render = function () {
        var _this = this;
        return run_async_1["default"](this._question["default"])(this._answers)
            .then(function (placeHolder) {
            if (placeHolder instanceof Error) {
                placeHolder = placeHolder.message;
                _this._question["default"] = undefined;
            }
            _this._options.placeHolder = placeHolder;
            return vscode_1.window.showInputBox(_this._options);
        })
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1["default"]();
            }
            if (result === '') {
                result = _this._options.placeHolder || '';
            }
            return run_async_1["default"](_this._question.validate)(result || '')
                .then(function (valid) {
                if (valid !== undefined && valid !== true) {
                    _this._question["default"] = new Error(figures.warning + " " + valid);
                    return _this.render();
                }
                return result;
            });
        });
    };
    return InputPrompt;
}(prompt_1["default"]));
exports["default"] = InputPrompt;
