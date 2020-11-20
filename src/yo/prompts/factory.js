"use strict";
exports.__esModule = true;
var input_1 = require("./input");
var password_1 = require("./password");
var list_1 = require("./list");
var confirm_1 = require("./confirm");
var checkbox_1 = require("./checkbox");
var expand_1 = require("./expand");
var PromptFactory = /** @class */ (function () {
    function PromptFactory() {
    }
    PromptFactory.createPrompt = function (question, answers) {
        /**
         * TODO:
         *   - folder
         */
        switch (question.type || 'input') {
            case 'string':
            case 'input':
                return new input_1["default"](question, answers);
            case 'password':
                return new password_1["default"](question, answers);
            case 'list':
                return new list_1["default"](question);
            case 'confirm':
                return new confirm_1["default"](question);
            case 'checkbox':
                return new checkbox_1["default"](question);
            case 'expand':
                return new expand_1["default"](question);
            default:
                throw new Error("Could not find a prompt for question type " + question.type);
        }
    };
    return PromptFactory;
}());
exports["default"] = PromptFactory;
