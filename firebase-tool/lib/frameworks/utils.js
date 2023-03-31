"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleProxy = exports.warnIfCustomBuildScript = exports.readJSON = exports.isUrl = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const http_1 = require("http");
const logger_1 = require("../logger");
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
function simpleProxy(hostOrRequestHandler) {
    const agent = new http_1.Agent({ keepAlive: true });
    return async (originalReq, originalRes, next) => {
        const { method, headers, url: path } = originalReq;
        if (!method || !path) {
            return originalRes.end();
        }
        const firebaseDefaultsJSON = process.env.__FIREBASE_DEFAULTS__;
        const authTokenSyncURL = firebaseDefaultsJSON && JSON.parse(firebaseDefaultsJSON)._authTokenSyncURL;
        if (path === authTokenSyncURL) {
            return next();
        }
        if (typeof hostOrRequestHandler === "string") {
            const host = hostOrRequestHandler;
            const { hostname, port, protocol, username, password } = new URL(host);
            const auth = username || password ? `${username}:${password}` : undefined;
            const opts = {
                agent,
                auth,
                protocol,
                hostname,
                port,
                path,
                method,
                headers: Object.assign(Object.assign({}, headers), { host, "X-Forwarded-Host": headers.host }),
            };
            const req = (0, http_1.request)(opts, (response) => {
                const { statusCode, statusMessage, headers } = response;
                originalRes.writeHead(statusCode, statusMessage, headers);
                response.pipe(originalRes);
            });
            originalReq.pipe(req);
            req.on("error", (err) => {
                logger_1.logger.debug("Error encountered while proxying request:", method, path, err);
                originalRes.end();
            });
        }
        else {
            await hostOrRequestHandler(originalReq, originalRes);
        }
    };
}
exports.simpleProxy = simpleProxy;
