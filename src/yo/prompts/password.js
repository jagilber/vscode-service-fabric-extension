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
var input_1 = require("./input");
var PasswordPrompt = /** @class */ (function (_super) {
    __extends(PasswordPrompt, _super);
    function PasswordPrompt(question, answers) {
        var _this = _super.call(this, question, answers) || this;
        _this._options.password = true;
        return _this;
    }
    return PasswordPrompt;
}(input_1["default"]));
exports["default"] = PasswordPrompt;
