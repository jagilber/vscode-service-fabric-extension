"use strict";
exports.__esModule = true;
var vscode_1 = require("vscode");
var runAsync = require('run-async');
var isFn = require('is-fn');
// Helper function that will show a progress bar while running a function async
function default_1(func) {
    if (!isFn(func)) {
        return function () {
            return Promise.resolve(func);
        };
    }
    var fn = runAsync(func);
    return function () {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function (resolve, reject) {
            Promise.resolve(vscode_1.window.showQuickPick(new Promise(function (res, rej) {
                fn.apply(fn, args)
                    .then(function (result) {
                    rej();
                    resolve(result);
                })["catch"](function (err) {
                    rej();
                    reject(err);
                });
            })))["catch"](function (err) {
                // do nothing because the input is always rejected
            });
        });
    };
}
exports["default"] = default_1;
