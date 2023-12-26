/* eslint-disable */

const gulp = require("gulp");
const execSync = require("child_process").execSync;
const { watch } = gulp;
const connect = require("gulp-connect");
const browserSync = require("browser-sync").create();

// For development, it is now possible to use 'gulp webserver'
// from the command line to start the server (default port is 8080)

const port = 1238;

gulp.task(
    "webserver",
    gulp.series(async function () {
        connect.server({
            port: port,
            https: false,
            livereload: true
        });
    })
);

gulp.task("pack", async function () {
    try {
        execSync("rollup -c", { stdio: "inherit" });
    } catch (e) {
        console.error(e);
    }
});

gulp.task("reload", async function () {
    browserSync.reload();
});

gulp.task(
    "default",
    gulp.parallel("pack", "webserver", async function () {
        browserSync.init({
            injectChanges: true,
            proxy: `http://localhost:${port}/`
        });

        let watchlist = ["./index.html", "./modules.js", "src/**/*.ts", "src/**/*.js", "src/**/*.less", "src/**/*.css", "src/**/*.less"];

        watch(watchlist, gulp.series("pack", "reload"));
    })
);

gulp.task("build", async function () {
    execSync("rollup -c ./rollup.config.release.js");

    execSync("javascript-obfuscator build/minimized_app.js -o build/app.js --compact true --source-map true");
});
