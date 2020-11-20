"use strict";
exports.__esModule = true;
exports._isLinux = exports._isMacintosh = exports._isWindows = void 0;
exports._isWindows = false;
exports._isMacintosh = false;
exports._isLinux = false;
exports._isWindows = (process.platform === 'win32');
exports._isMacintosh = (process.platform === 'darwin');
exports._isLinux = (process.platform === 'linux');
