import html from "rollup-plugin-html";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import less from "rollup-plugin-less";
import eslint from "@rbnlffl/rollup-plugin-eslint";
// import typescript from "@rollup/plugin-typescript";

const plugins = [
    html({
        // added to import html file as template
        include: "**/*.html"
    }),
    json(),
    nodeResolve({
        preferBuiltins: true
    }),
    commonjs({
        include: /node_modules/
    }),
    less({
        insert: true,
        include: ["**/*.less", "**/*.css"]
    }),
    eslint({
        filterExclude: ["./node_modules/**/*.*", "./package.json", "./src/**/*.less", "./src/**/*.css", "./src/**/*.html"]
    })
    // typescript()
];

const globals = {
    cesium: "Cesium",
    punycode: "require$$8",
    hammerjs: "Hammer"
};

export default [
    {
        input: "src/index.js",
        treeshake: false,
        external: ["cesium", "hammerjs"],
        output: {
            file: "app.js",
            format: "umd",
            name: "Luccy",
            sourcemap: true,
            globals: globals
        },
        plugins: plugins
    }
];
