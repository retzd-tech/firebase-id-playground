"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerResponseProxy = exports.prepareFrameworks = exports.findDependency = exports.discover = exports.relativeRequire = exports.WebFrameworks = exports.ALLOWED_SSR_REGIONS = exports.DEFAULT_REGION = exports.NODE_VERSION = exports.FIREBASE_ADMIN_VERSION = exports.FIREBASE_FUNCTIONS_VERSION = exports.FIREBASE_FRAMEWORKS_VERSION = void 0;
const path_1 = require("path");
const process_1 = require("process");
const child_process_1 = require("child_process");
const cross_spawn_1 = require("cross-spawn");
const fs_1 = require("fs");
const url_1 = require("url");
const http_1 = require("http");
const promises_1 = require("fs/promises");
const fs_extra_1 = require("fs-extra");
const clc = require("colorette");
const process = require("node:process");
const semver = require("semver");
const glob = require("glob");
const projectUtils_1 = require("../projectUtils");
const config_1 = require("../hosting/config");
const api_1 = require("../hosting/api");
const apps_1 = require("../management/apps");
const prompt_1 = require("../prompt");
const types_1 = require("../emulator/types");
const defaultCredentials_1 = require("../defaultCredentials");
const auth_1 = require("../auth");
const functionsEmulatorShared_1 = require("../emulator/functionsEmulatorShared");
const constants_1 = require("../emulator/constants");
const error_1 = require("../error");
const requireHostingSite_1 = require("../requireHostingSite");
const experiments = require("../experiments");
const ensureTargeted_1 = require("../functions/ensureTargeted");
const implicitInit_1 = require("../hosting/implicitInit");
const { dynamicImport } = require(true && "../dynamicImport");
const SupportLevelWarnings = {
    ["experimental"]: clc.yellow(`This is an experimental integration, proceed with caution.`),
    ["community-supported"]: clc.yellow(`This is a community-supported integration, support is best effort.`),
};
exports.FIREBASE_FRAMEWORKS_VERSION = "^0.6.0";
exports.FIREBASE_FUNCTIONS_VERSION = "^3.23.0";
exports.FIREBASE_ADMIN_VERSION = "^11.0.1";
exports.NODE_VERSION = parseInt(process.versions.node, 10).toString();
exports.DEFAULT_REGION = "us-central1";
exports.ALLOWED_SSR_REGIONS = [
    { name: "us-central1 (Iowa)", value: "us-central1" },
    { name: "us-west1 (Oregon)", value: "us-west1" },
    { name: "us-east1 (South Carolina)", value: "us-east1" },
    { name: "europe-west1 (Belgium)", value: "europe-west1" },
    { name: "asia-east1 (Taiwan)", value: "asia-east1" },
];
const DEFAULT_FIND_DEP_OPTIONS = {
    cwd: process.cwd(),
    omitDev: true,
};
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";
exports.WebFrameworks = Object.fromEntries((0, fs_1.readdirSync)(__dirname)
    .filter((path) => (0, fs_1.statSync)((0, path_1.join)(__dirname, path)).isDirectory())
    .map((path) => [path, require((0, path_1.join)(__dirname, path))])
    .filter(([, obj]) => obj.name && obj.discover && obj.build && obj.type !== undefined && obj.support));
function relativeRequire(dir, mod) {
    try {
        const path = require.resolve(mod, { paths: [dir] });
        if ((0, path_1.extname)(path) === ".mjs") {
            return dynamicImport((0, url_1.pathToFileURL)(path).toString());
        }
        else {
            return require(path);
        }
    }
    catch (e) {
        const path = (0, path_1.relative)(process.cwd(), dir);
        console.error(`Could not load dependency ${mod} in ${path.startsWith("..") ? path : `./${path}`}, have you run \`npm install\`?`);
        throw e;
    }
}
exports.relativeRequire = relativeRequire;
async function discover(dir, warn = true) {
    const allFrameworkTypes = [
        ...new Set(Object.values(exports.WebFrameworks).map(({ type }) => type)),
    ].sort();
    for (const discoveryType of allFrameworkTypes) {
        const frameworksDiscovered = [];
        for (const framework in exports.WebFrameworks) {
            if (exports.WebFrameworks[framework]) {
                const { discover, type } = exports.WebFrameworks[framework];
                if (type !== discoveryType)
                    continue;
                const result = await discover(dir);
                if (result)
                    frameworksDiscovered.push(Object.assign({ framework }, result));
            }
        }
        if (frameworksDiscovered.length > 1) {
            if (warn)
                console.error("Multiple conflicting frameworks discovered.");
            return;
        }
        if (frameworksDiscovered.length === 1)
            return frameworksDiscovered[0];
    }
    if (warn)
        console.warn("Could not determine the web framework in use.");
    return;
}
exports.discover = discover;
function scanDependencyTree(searchingFor, dependencies = {}) {
    for (const [name, dependency] of Object.entries(dependencies)) {
        if (name === searchingFor)
            return dependency;
        const result = scanDependencyTree(searchingFor, dependency.dependencies);
        if (result)
            return result;
    }
    return;
}
function findDependency(name, options = {}) {
    const { cwd, depth, omitDev } = Object.assign(Object.assign({}, DEFAULT_FIND_DEP_OPTIONS), options);
    const env = Object.assign({}, process.env);
    delete env.NODE_ENV;
    const result = (0, cross_spawn_1.sync)(NPM_COMMAND, [
        "list",
        name,
        "--json",
        ...(omitDev ? ["--omit", "dev"] : []),
        ...(depth === undefined ? [] : ["--depth", depth.toString(10)]),
    ], { cwd, env });
    if (!result.stdout)
        return;
    const json = JSON.parse(result.stdout.toString());
    return scanDependencyTree(name, json.dependencies);
}
exports.findDependency = findDependency;
async function prepareFrameworks(targetNames, context, options, emulators = []) {
    var _a, _b, _c;
    var _d, _e, _f, _g;
    const nodeVersion = process.version;
    if (!semver.satisfies(nodeVersion, ">=16.0.0")) {
        throw new error_1.FirebaseError(`The frameworks awareness feature requires Node.JS >= 16 and npm >= 8 in order to work correctly, due to some of the downstream dependencies. Please upgrade your version of Node.JS, reinstall firebase-tools, and give it another go.`);
    }
    const project = (0, projectUtils_1.needProjectId)(context);
    const { projectRoot } = options;
    const account = (0, auth_1.getProjectDefaultAccount)(projectRoot);
    if (!options.site) {
        try {
            await (0, requireHostingSite_1.requireHostingSite)(options);
        }
        catch (_h) {
            options.site = project;
        }
    }
    const configs = (0, config_1.hostingConfig)(options);
    let firebaseDefaults = undefined;
    if (configs.length === 0) {
        return;
    }
    const allowedRegionsValues = exports.ALLOWED_SSR_REGIONS.map((r) => r.value);
    for (const config of configs) {
        const { source, site, public: publicDir, frameworksBackend } = config;
        if (!source) {
            continue;
        }
        config.rewrites || (config.rewrites = []);
        config.redirects || (config.redirects = []);
        config.headers || (config.headers = []);
        (_a = config.cleanUrls) !== null && _a !== void 0 ? _a : (config.cleanUrls = true);
        const dist = (0, path_1.join)(projectRoot, ".firebase", site);
        const hostingDist = (0, path_1.join)(dist, "hosting");
        const functionsDist = (0, path_1.join)(dist, "functions");
        if (publicDir) {
            throw new Error(`hosting.public and hosting.source cannot both be set in firebase.json`);
        }
        const ssrRegion = (_b = frameworksBackend === null || frameworksBackend === void 0 ? void 0 : frameworksBackend.region) !== null && _b !== void 0 ? _b : exports.DEFAULT_REGION;
        if (!allowedRegionsValues.includes(ssrRegion)) {
            const validRegions = allowedRegionsValues.join(", ");
            throw new error_1.FirebaseError(`Hosting config for site ${site} places server-side content in region ${ssrRegion} which is not known. Valid regions are ${validRegions}`);
        }
        const getProjectPath = (...args) => (0, path_1.join)(projectRoot, source, ...args);
        const functionId = `ssr${site.toLowerCase().replace(/-/g, "")}`;
        const usesFirebaseAdminSdk = !!findDependency("firebase-admin", { cwd: getProjectPath() });
        const usesFirebaseJsSdk = !!findDependency("@firebase/app", { cwd: getProjectPath() });
        if (usesFirebaseAdminSdk) {
            process.env.GOOGLE_CLOUD_PROJECT = project;
            if (account && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                const defaultCredPath = await (0, defaultCredentials_1.getCredentialPathAsync)(account);
                if (defaultCredPath)
                    process.env.GOOGLE_APPLICATION_CREDENTIALS = defaultCredPath;
            }
        }
        emulators.forEach((info) => {
            if (usesFirebaseAdminSdk) {
                if (info.name === types_1.Emulators.FIRESTORE)
                    process.env[constants_1.Constants.FIRESTORE_EMULATOR_HOST] = (0, functionsEmulatorShared_1.formatHost)(info);
                if (info.name === types_1.Emulators.AUTH)
                    process.env[constants_1.Constants.FIREBASE_AUTH_EMULATOR_HOST] = (0, functionsEmulatorShared_1.formatHost)(info);
                if (info.name === types_1.Emulators.DATABASE)
                    process.env[constants_1.Constants.FIREBASE_DATABASE_EMULATOR_HOST] = (0, functionsEmulatorShared_1.formatHost)(info);
                if (info.name === types_1.Emulators.STORAGE)
                    process.env[constants_1.Constants.FIREBASE_STORAGE_EMULATOR_HOST] = (0, functionsEmulatorShared_1.formatHost)(info);
            }
            if (usesFirebaseJsSdk && types_1.EMULATORS_SUPPORTED_BY_USE_EMULATOR.includes(info.name)) {
                firebaseDefaults || (firebaseDefaults = {});
                firebaseDefaults.emulatorHosts || (firebaseDefaults.emulatorHosts = {});
                firebaseDefaults.emulatorHosts[info.name] = (0, functionsEmulatorShared_1.formatHost)(info);
            }
        });
        let firebaseConfig = null;
        if (usesFirebaseJsSdk) {
            const sites = await (0, api_1.listSites)(project);
            const selectedSite = sites.find((it) => it.name && it.name.split("/").pop() === site);
            if (selectedSite) {
                const { appId } = selectedSite;
                if (appId) {
                    firebaseConfig = await (0, apps_1.getAppConfig)(appId, apps_1.AppPlatform.WEB);
                    firebaseDefaults || (firebaseDefaults = {});
                    firebaseDefaults.config = firebaseConfig;
                }
                else {
                    const defaultConfig = await (0, implicitInit_1.implicitInit)(options);
                    if (defaultConfig.json) {
                        console.warn(`No Firebase app associated with site ${site}, injecting project default config.
  You can link a Web app to a Hosting site here https://console.firebase.google.com/project/${project}/settings/general/web`);
                        firebaseDefaults || (firebaseDefaults = {});
                        firebaseDefaults.config = JSON.parse(defaultConfig.json);
                    }
                    else {
                        console.warn(`No Firebase app associated with site ${site}, unable to provide authenticated server context.
  You can link a Web app to a Hosting site here https://console.firebase.google.com/project/${project}/settings/general/web`);
                        if (!options.nonInteractive) {
                            const continueDeploy = await (0, prompt_1.promptOnce)({
                                type: "confirm",
                                default: true,
                                message: "Would you like to continue with the deploy?",
                            });
                            if (!continueDeploy)
                                (0, process_1.exit)(1);
                        }
                    }
                }
            }
        }
        if (firebaseDefaults)
            process.env.__FIREBASE_DEFAULTS__ = JSON.stringify(firebaseDefaults);
        const results = await discover(getProjectPath());
        if (!results)
            throw new Error("Epic fail.");
        const { framework, mayWantBackend, publicDirectory } = results;
        const { build, ɵcodegenPublicDirectory, ɵcodegenFunctionsDirectory: codegenProdModeFunctionsDirectory, getDevModeHandle, name, support, } = exports.WebFrameworks[framework];
        console.log(`Detected a ${name} codebase. ${SupportLevelWarnings[support] || ""}\n`);
        const isDevMode = context._name === "serve" || context._name === "emulators:start";
        const hostingEmulatorInfo = emulators.find((e) => e.name === types_1.Emulators.HOSTING);
        const devModeHandle = isDevMode &&
            getDevModeHandle &&
            (await getDevModeHandle(getProjectPath(), hostingEmulatorInfo));
        let codegenFunctionsDirectory;
        if (devModeHandle) {
            config.public = (0, path_1.relative)(projectRoot, publicDirectory);
            options.frameworksDevModeHandle = devModeHandle;
            if (mayWantBackend && firebaseDefaults) {
                codegenFunctionsDirectory = codegenDevModeFunctionsDirectory;
            }
        }
        else {
            const { wantsBackend = false, rewrites = [], redirects = [], headers = [], trailingSlash, } = (await build(getProjectPath())) || {};
            config.rewrites.push(...rewrites);
            config.redirects.push(...redirects);
            config.headers.push(...headers);
            (_c = config.trailingSlash) !== null && _c !== void 0 ? _c : (config.trailingSlash = trailingSlash);
            if (await (0, fs_extra_1.pathExists)(hostingDist))
                await (0, promises_1.rm)(hostingDist, { recursive: true });
            await (0, fs_extra_1.mkdirp)(hostingDist);
            await ɵcodegenPublicDirectory(getProjectPath(), hostingDist);
            config.public = (0, path_1.relative)(projectRoot, hostingDist);
            if (wantsBackend)
                codegenFunctionsDirectory = codegenProdModeFunctionsDirectory;
        }
        config.webFramework = `${framework}${codegenFunctionsDirectory ? "_ssr" : ""}`;
        if (codegenFunctionsDirectory) {
            if (firebaseDefaults)
                firebaseDefaults._authTokenSyncURL = "/__session";
            const rewrite = {
                source: "**",
                function: {
                    functionId,
                },
            };
            if (experiments.isEnabled("pintags")) {
                rewrite.function.pinTag = true;
            }
            config.rewrites.push(rewrite);
            const codebase = `firebase-frameworks-${site}`;
            const existingFunctionsConfig = options.config.get("functions")
                ? [].concat(options.config.get("functions"))
                : [];
            options.config.set("functions", [
                ...existingFunctionsConfig,
                {
                    source: (0, path_1.relative)(projectRoot, functionsDist),
                    codebase,
                },
            ]);
            if (!targetNames.includes("functions")) {
                targetNames.unshift("functions");
            }
            if (options.only) {
                options.only = (0, ensureTargeted_1.ensureTargeted)(options.only, codebase);
            }
            if (await (0, fs_extra_1.pathExists)(functionsDist)) {
                const functionsDistStat = await (0, fs_extra_1.stat)(functionsDist);
                if (functionsDistStat === null || functionsDistStat === void 0 ? void 0 : functionsDistStat.isDirectory()) {
                    const files = await (0, promises_1.readdir)(functionsDist);
                    for (const file of files) {
                        if (file !== "node_modules" && file !== "package-lock.json")
                            await (0, promises_1.rm)((0, path_1.join)(functionsDist, file), { recursive: true });
                    }
                }
                else {
                    await (0, promises_1.rm)(functionsDist);
                }
            }
            else {
                await (0, fs_extra_1.mkdirp)(functionsDist);
            }
            const { packageJson, bootstrapScript, frameworksEntry = framework, } = await codegenFunctionsDirectory(getProjectPath(), functionsDist);
            process.env.__FIREBASE_FRAMEWORKS_ENTRY__ = frameworksEntry;
            packageJson.main = "server.js";
            delete packageJson.devDependencies;
            packageJson.dependencies || (packageJson.dependencies = {});
            (_d = packageJson.dependencies)["firebase-frameworks"] || (_d["firebase-frameworks"] = exports.FIREBASE_FRAMEWORKS_VERSION);
            (_e = packageJson.dependencies)["firebase-functions"] || (_e["firebase-functions"] = exports.FIREBASE_FUNCTIONS_VERSION);
            (_f = packageJson.dependencies)["firebase-admin"] || (_f["firebase-admin"] = exports.FIREBASE_ADMIN_VERSION);
            packageJson.engines || (packageJson.engines = {});
            (_g = packageJson.engines).node || (_g.node = exports.NODE_VERSION);
            for (const [name, version] of Object.entries(packageJson.dependencies)) {
                if (version.startsWith("file:")) {
                    const path = version.replace(/^file:/, "");
                    if (!(await (0, fs_extra_1.pathExists)(path)))
                        continue;
                    const stats = await (0, fs_extra_1.stat)(path);
                    if (stats.isDirectory()) {
                        const result = (0, cross_spawn_1.sync)("npm", ["pack", (0, path_1.relative)(functionsDist, path)], {
                            cwd: functionsDist,
                        });
                        if (!result.stdout)
                            throw new Error(`Error running \`npm pack\` at ${path}`);
                        const filename = result.stdout.toString().trim();
                        packageJson.dependencies[name] = `file:${filename}`;
                    }
                    else {
                        const filename = (0, path_1.basename)(path);
                        await (0, promises_1.copyFile)(path, (0, path_1.join)(functionsDist, filename));
                        packageJson.dependencies[name] = `file:${filename}`;
                    }
                }
            }
            await (0, promises_1.writeFile)((0, path_1.join)(functionsDist, "package.json"), JSON.stringify(packageJson, null, 2));
            await (0, promises_1.copyFile)(getProjectPath("package-lock.json"), (0, path_1.join)(functionsDist, "package-lock.json")).catch(() => {
            });
            if (await (0, fs_extra_1.pathExists)(getProjectPath(".npmrc"))) {
                await (0, promises_1.copyFile)(getProjectPath(".npmrc"), (0, path_1.join)(functionsDist, ".npmrc"));
            }
            let existingDotEnvContents = "";
            if (await (0, fs_extra_1.pathExists)(getProjectPath(".env"))) {
                existingDotEnvContents = (await (0, promises_1.readFile)(getProjectPath(".env"))).toString();
            }
            await (0, promises_1.writeFile)((0, path_1.join)(functionsDist, ".env"), `${existingDotEnvContents}
__FIREBASE_FRAMEWORKS_ENTRY__=${frameworksEntry}
${firebaseDefaults ? `__FIREBASE_DEFAULTS__=${JSON.stringify(firebaseDefaults)}\n` : ""}`);
            const envs = await new Promise((resolve, reject) => glob(getProjectPath(".env.*"), (err, matches) => {
                if (err)
                    reject(err);
                resolve(matches);
            }));
            await Promise.all(envs.map((path) => (0, promises_1.copyFile)(path, (0, path_1.join)(functionsDist, (0, path_1.basename)(path)))));
            (0, child_process_1.execSync)(`${NPM_COMMAND} i --omit dev --no-audit`, {
                cwd: functionsDist,
                stdio: "inherit",
            });
            if (bootstrapScript)
                await (0, promises_1.writeFile)((0, path_1.join)(functionsDist, "bootstrap.js"), bootstrapScript);
            if (packageJson.type === "module") {
                await (0, promises_1.writeFile)((0, path_1.join)(functionsDist, "server.js"), `import { onRequest } from 'firebase-functions/v2/https';
  const server = import('firebase-frameworks');
  export const ${functionId} = onRequest(${JSON.stringify(frameworksBackend || {})}, (req, res) => server.then(it => it.handle(req, res)));
  `);
            }
            else {
                await (0, promises_1.writeFile)((0, path_1.join)(functionsDist, "server.js"), `const { onRequest } = require('firebase-functions/v2/https');
  const server = import('firebase-frameworks');
  exports.${functionId} = onRequest(${JSON.stringify(frameworksBackend || {})}, (req, res) => server.then(it => it.handle(req, res)));
  `);
            }
        }
        else {
            config.rewrites.push({
                source: "**",
                destination: "/index.html",
            });
        }
        if (firebaseDefaults) {
            const encodedDefaults = Buffer.from(JSON.stringify(firebaseDefaults)).toString("base64url");
            const expires = new Date(new Date().getTime() + 60000000000);
            const sameSite = "Strict";
            const path = `/`;
            config.headers.push({
                source: "**/*.js",
                headers: [
                    {
                        key: "Set-Cookie",
                        value: `__FIREBASE_DEFAULTS__=${encodedDefaults}; SameSite=${sameSite}; Expires=${expires.toISOString()}; Path=${path};`,
                    },
                ],
            });
        }
    }
}
exports.prepareFrameworks = prepareFrameworks;
function codegenDevModeFunctionsDirectory() {
    const packageJson = {};
    return Promise.resolve({ packageJson, frameworksEntry: "_devMode" });
}
function createServerResponseProxy(req, res, next) {
    const proxiedRes = new http_1.ServerResponse(req);
    const buffer = [];
    proxiedRes.write = new Proxy(proxiedRes.write.bind(proxiedRes), {
        apply: (target, thisArg, args) => {
            target.call(thisArg, ...args);
            buffer.push(["write", args]);
        },
    });
    proxiedRes.setHeader = new Proxy(proxiedRes.setHeader.bind(proxiedRes), {
        apply: (target, thisArg, args) => {
            target.call(thisArg, ...args);
            buffer.push(["setHeader", args]);
        },
    });
    proxiedRes.removeHeader = new Proxy(proxiedRes.removeHeader.bind(proxiedRes), {
        apply: (target, thisArg, args) => {
            target.call(thisArg, ...args);
            buffer.push(["removeHeader", args]);
        },
    });
    proxiedRes.writeHead = new Proxy(proxiedRes.writeHead.bind(proxiedRes), {
        apply: (target, thisArg, args) => {
            target.call(thisArg, ...args);
            buffer.push(["writeHead", args]);
        },
    });
    proxiedRes.end = new Proxy(proxiedRes.end.bind(proxiedRes), {
        apply: (target, thisArg, args) => {
            target.call(thisArg, ...args);
            if (proxiedRes.statusCode === 404) {
                next();
            }
            else {
                for (const [fn, args] of buffer) {
                    res[fn](...args);
                }
                res.end(...args);
            }
        },
    });
    return proxiedRes;
}
exports.createServerResponseProxy = createServerResponseProxy;
