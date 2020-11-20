"use strict";
exports.__esModule = true;
var path = require("path");
var fs = require("fs");
var childProcess = require("child_process");
var os_1 = require("os");
var adapter_1 = require("./adapter");
var yeoman = require('yeoman-environment');
var uniq = require('array-uniq');
var win32 = process.platform === 'win32';
var getNpmPaths = function () {
    if (process.env.NODE_PATH) {
        return process.env.NODE_PATH.split(path.delimiter);
    }
    require('fix-path')();
    // Get the npm path from the user env variables.
    var paths = process.env.PATH.split(path.delimiter).map(function (item) { return path.join(item, '..', 'lib', 'node_modules'); });
    // Add npm path by running npm root command
    paths.push(childProcess.execSync('npm root -g', { encoding: 'utf8' }).toString().trim());
    // Default paths for each system
    if (win32) {
        paths.push(path.join(process.env.APPDATA, 'npm', 'node_modules'));
    }
    else {
        paths.push('/usr/lib/node_modules');
    }
    try {
        // Somehow `npm get prefix` does not return the correct value
        var userconfig = childProcess.execSync('npm get userconfig', { encoding: 'utf8' }).toString().trim();
        var content = fs.readFileSync(userconfig).toString('utf8');
        var match = content.match(new RegExp("prefix=(.*?)" + os_1.EOL));
        if (match) {
            if (win32) {
                paths.push(path.join(match[1], 'node_modules'));
            }
            else {
                paths.push(path.join(match[1], 'lib', 'node_modules'));
            }
        }
    }
    catch (err) {
    }
    return uniq(paths.reverse());
};
function default_1(args, opts) {
    args = args || [];
    opts = opts || {};
    var env = yeoman.createEnv(args, opts, new adapter_1["default"]());
    env.getNpmPaths = getNpmPaths;
    return env;
}
exports["default"] = default_1;
