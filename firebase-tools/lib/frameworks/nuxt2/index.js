"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ɵcodegenFunctionsDirectory = exports.ɵcodegenPublicDirectory = exports.build = exports.discover = exports.type = exports.support = exports.name = void 0;
const fs_extra_1 = require("fs-extra");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const semver_1 = require("semver");
const __1 = require("..");
const utils_1 = require("../nuxt/utils");
exports.name = "Nuxt";
exports.support = "experimental";
exports.type = 2;
async function discover(dir) {
    if (!(await (0, fs_extra_1.pathExists)((0, path_1.join)(dir, "package.json"))))
        return;
    const nuxtDependency = (0, __1.findDependency)("nuxt", {
        cwd: dir,
        depth: 0,
        omitDev: false,
    });
    const version = nuxtDependency === null || nuxtDependency === void 0 ? void 0 : nuxtDependency.version;
    const anyConfigFileExists = await (0, utils_1.nuxtConfigFilesExist)(dir);
    if (!anyConfigFileExists && !nuxtDependency)
        return;
    if (version && (0, semver_1.lt)(version, "3.0.0-0"))
        return { mayWantBackend: true };
    return;
}
exports.discover = discover;
async function getNuxtApp(cwd) {
    return await (0, __1.relativeRequire)(cwd, "nuxt/dist/nuxt.js");
}
async function build(root) {
    const nuxt = await getNuxtApp(root);
    const nuxtApp = await nuxt.loadNuxt({
        for: "build",
        rootDir: root,
    });
    const { options: { ssr, target }, } = await nuxt.build(nuxtApp);
    if (ssr === true && target === "server") {
        return { wantsBackend: true };
    }
    else {
        if (ssr === false && target === "static") {
            console.log("Firebase: Nuxt 2: Static target is not supported with `ssr: false`. Please use `target: 'server'` in your `nuxt.config.js` file.");
            console.log("Firebase: Nuxt 2: Bundling only for client side.\n");
        }
        await buildAndGenerate(nuxt, root);
        return { wantsBackend: false };
    }
}
exports.build = build;
async function buildAndGenerate(nuxt, root) {
    const nuxtApp = await nuxt.loadNuxt({
        for: "start",
        rootDir: root,
    });
    const builder = await nuxt.getBuilder(nuxtApp);
    const generator = new nuxt.Generator(nuxtApp, builder);
    await generator.generate({ build: false, init: true });
}
async function ɵcodegenPublicDirectory(root, dest) {
    var _a, _b;
    const nuxt = await getNuxtApp(root);
    const nuxtConfig = await nuxt.loadNuxtConfig();
    const { ssr, target } = nuxtConfig;
    if (!(ssr === true && target === "server")) {
        const source = ((_a = nuxtConfig === null || nuxtConfig === void 0 ? void 0 : nuxtConfig.generate) === null || _a === void 0 ? void 0 : _a.dir) !== undefined
            ? (0, path_1.join)(root, (_b = nuxtConfig === null || nuxtConfig === void 0 ? void 0 : nuxtConfig.generate) === null || _b === void 0 ? void 0 : _b.dir)
            : (0, path_1.join)(root, "dist");
        await (0, fs_extra_1.copy)(source, dest);
    }
    const staticPath = (0, path_1.join)(root, "static");
    if (await (0, fs_extra_1.pathExists)(staticPath)) {
        await (0, fs_extra_1.copy)(staticPath, dest);
    }
}
exports.ɵcodegenPublicDirectory = ɵcodegenPublicDirectory;
async function ɵcodegenFunctionsDirectory(sourceDir, destDir) {
    const packageJsonBuffer = await (0, promises_1.readFile)((0, path_1.join)(sourceDir, "package.json"));
    const packageJson = JSON.parse(packageJsonBuffer.toString());
    const nuxt = await getNuxtApp(sourceDir);
    const nuxtConfig = await nuxt.loadNuxtConfig();
    await (0, fs_extra_1.copy)((0, path_1.join)(sourceDir, ".nuxt"), (0, path_1.join)(destDir, ".nuxt"));
    if (!nuxtConfig.ssr) {
        const nuxtConfigFile = nuxtConfig._nuxtConfigFile.split("/").pop();
        await (0, fs_extra_1.copy)(nuxtConfig._nuxtConfigFile, (0, path_1.join)(destDir, nuxtConfigFile));
    }
    return { packageJson: Object.assign({}, packageJson), frameworksEntry: "nuxt" };
}
exports.ɵcodegenFunctionsDirectory = ɵcodegenFunctionsDirectory;
