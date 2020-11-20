"use strict";
exports.__esModule = true;
var util = require("util");
var vscode_1 = require("vscode");
var factory_1 = require("../prompts/factory");
var run_async_1 = require("../utils/run-async");
var logger = require('yeoman-environment/lib/util/log');
var diff = require('diff');
var isFn = require('is-fn');
var CodeAdapter = /** @class */ (function () {
    function CodeAdapter() {
        this.log = logger();
        this.outBuffer = '';
        var self = this;
        this.outChannel = vscode_1.window.createOutputChannel('Yeoman');
        this.outChannel.clear();
        this.outChannel.show(true);
        // TODO Do not overwrite these methods
        console.error = console.log = function () {
            var line = util.format.apply(util, arguments);
            self.outBuffer += line + "\n";
            self.outChannel.appendLine(line);
            return this;
        };
        this.log.write = function () {
            var line = util.format.apply(util, arguments);
            self.outBuffer += line;
            self.outChannel.append(line);
            return this;
        };
    }
    CodeAdapter.prototype.prompt = function (questions, callback) {
        var _this = this;
        var answers = {};
        callback = callback || function () { };
        var promise = questions.reduce(function (promise, question) {
            return promise
                .then(function () {
                if (question.when === undefined) {
                    return true;
                }
                else if (isFn(question.when)) {
                    return run_async_1["default"](question.when)(answers);
                }
                return question.when;
            })
                .then(function (askQuestion) {
                if (askQuestion) {
                    var prompt_1 = factory_1["default"].createPrompt(question, answers);
                    return prompt_1.render().then(function (result) { return answers[question.name] = question.filter ? question.filter(result) : result; });
                }
            });
        }, Promise.resolve());
        return promise
            .then(function () {
            _this.outChannel.clear();
            _this.outChannel.append(_this.outBuffer);
            callback(answers);
            return answers;
        });
    };
    CodeAdapter.prototype.diff = function (actual, expected) {
        var _this = this;
        this.outChannel.clear();
        var result = diff.diffLines(actual, expected);
        result.map(function (part) {
            var prefix = ' ';
            if (part.added === true) {
                prefix = '+';
            }
            else if (part.removed === true) {
                prefix = '-';
            }
            part.value = part.value.split('\n').map(function (line) {
                if (line.trim().length === 0) {
                    return line;
                }
                return "" + prefix + line;
            }).join('\n');
            _this.outChannel.append(part.value);
        });
    };
    return CodeAdapter;
}());
exports["default"] = CodeAdapter;
