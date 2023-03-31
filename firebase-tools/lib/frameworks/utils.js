"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnIfCustomBuildScript = exports.readJSON = exports.isUrl = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const promises_1 = require("fs/promises");
function isUrl(url) {
    return /^https?:\/\//.test(url);
}
exports.isUrl = isUrl;
function readJSON(file, options) {
    return (0, fs_extra_1.readJSON)(file, options);
}
exports.readJSON = readJSON;
async function warnIfCustomBuildScript(dir, framework, defaultBuildScripts) {
    var _a;
    const packageJsonBuffer = await (0, promises_1.readFile)((0, path_1.join)(dir, "package.json"));
    const packageJson = JSON.parse(packageJsonBuffer.toString());
    const buildScript = (_a = packageJson.scripts) === null || _a === void 0 ? void 0 : _a.build;
    if (buildScript && !defaultBuildScripts.includes(buildScript)) {
        console.warn(`\nWARNING: Your package.json contains a custom build that is being ignored. Only the ${framework} default build script (e.g, "${defaultBuildScripts[0]}") is respected. If you have a more advanced build process you should build a custom integration https://firebase.google.com/docs/hosting/express\n`);
    }
}
exports.warnIfCustomBuildScript = warnIfCustomBuildScript;
