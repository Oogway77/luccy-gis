import { terser } from "rollup-plugin-terser";
import html from "rollup-plugin-html";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import less from "rollup-plugin-less";
import typescript from "@rollup/plugin-typescript";

const plugins = [
    html({
        // added to import html file as template
        include: "**/*.html"
    }),
    terser(),
    json(),
    nodeResolve(),
    commonjs({
        include: /node_modules/,
        namedExports: {}
    }),
    less({
        insert: true,
        include: ["**/*.less", "**/*.css"]
    }),
    typescript()
];

const globals = {
    cesium: "Cesium"
};

export default [
    {
        input: "src/index.js",
        treeshake: false,
        external: ["cesium"],
        output: {
            file: "build/minimized_app.js",
            format: "umd",
            name: "Luccy",
            sourcemap: true,
            globals: globals
        },
        plugins: plugins
    }
];
