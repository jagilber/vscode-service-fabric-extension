"use strict";
exports.__esModule = true;
var vscode_1 = require("vscode");
var os_1 = require("os");
var _ = require("lodash");
var environment_1 = require("./environment");
var EscapeException_1 = require("../utils/EscapeException");
var readPkgUp = require('read-pkg-up');
var semver = require('semver');
var elegantSpinner = require('elegant-spinner');
var figures = require('figures');
var frame = elegantSpinner();
var Yeoman = /** @class */ (function () {
    function Yeoman(options) {
        this._options = options;
        this._env = environment_1["default"](undefined, options);
        this._status = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
        this._interval;
    }
    Yeoman.prototype.getEnvironment = function () {
        return this._env;
    };
    Yeoman.prototype.getGenerators = function () {
        var generatorsMeta = this._env.store.getGeneratorsMeta();
        // Remove sub generators from list
        var list = Object.keys(generatorsMeta).filter(function (key) { return key.split(':')[1] === 'app'; });
        list = list.map(function (key) {
            var item = generatorsMeta[key];
            var name = key.split(':')[0];
            var pkgPath = readPkgUp.sync({ cwd: item.resolved });
            if (!pkgPath.pkg) {
                return null;
            }
            var pkg = pkgPath.pkg;
            var generatorVersion = pkg.dependencies['yeoman-generator'];
            var generatorMeta = _.pick(pkg, 'name', 'version', 'description');
            // Ignore the generator if does not depend on `yeoman-generator`
            if (!generatorVersion) {
                return null;
            }
            // Flag generator to indecate if the generator version is fully supported or not.
            // https://github.com/yeoman/yeoman-app/issues/16#issuecomment-121054821
            generatorMeta.isCompatible = semver.ltr('0.17.6', generatorVersion);
            // Indicator to verify official generators
            generatorMeta.officialGenerator = false;
            if (generatorMeta.repository && generatorMeta.repository.url) {
                generatorMeta.officialGenerator = generatorMeta.repository.url.indexOf('github.com/yeoman/') > -1;
            }
            // Add subgenerators
            generatorMeta.subGenerators = Object.keys(generatorsMeta).reduce(function (result, key) {
                var split = key.split(':');
                if (split[0] === name) {
                    result.push(split[1]);
                }
                return result;
            }, []);
            return generatorMeta;
        });
        return _.compact(list);
    };
    Yeoman.prototype.run = function (generator, cwd) {
        var _this = this;
        if (!cwd) {
            throw new Error('Please open a workspace directory first.');
        }
        process.chdir(cwd);
        var prefix = 'generator-';
        if (generator.indexOf(prefix) === 0) {
            generator = generator.slice(prefix.length);
        }
        return new Promise(function (resolve, reject) {
            Promise.resolve(vscode_1.window.showQuickPick(new Promise(function (res, rej) {
                setImmediate(function () {
                    try {
                        _this._env.run(generator, _this.done)
                            .on('npmInstall', function () {
                            _this.setState('install node dependencies');
                        })
                            .on('bowerInstall', function () {
                            _this.setState('install bower dependencies');
                        })
                            .on('error', function (err) {
                            if (!(err instanceof EscapeException_1["default"])) {
                                vscode_1.window.showErrorMessage(err.message);
                                throw err;
                            }
                        })
                            .on('end', function () {
                            _this.clearState();
                            console.log("" + os_1.EOL + figures.tick + " done");
                            resolve(res);
                        });
                    }
                    catch (err) {
                        reject(err);
                    }
                    rej();
                });
            })))["catch"](function (err) {
                // do nothing because the input is always rejected
            });
        });
    };
    Yeoman.prototype.setState = function (state) {
        var _this = this;
        console.log(state);
        this._status.show();
        this._status.tooltip = state;
        this._interval = setInterval(function () {
            _this._status.text = frame() + " yo";
        }, 50);
    };
    Yeoman.prototype.clearState = function () {
        clearInterval(this._interval);
        this._status.dispose();
    };
    Yeoman.prototype.done = function (err) {
        if (err) {
            // handle error
        }
    };
    return Yeoman;
}());
exports["default"] = Yeoman;
