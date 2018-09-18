var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");


gulp.task("build", function(){
    return tsProject.src()
        .pipe(tsProject())
        .js.pipe(gulp.dest("js"));
})


gulp.task("watch", function(){
    gulp.watch("./ts/**.ts", ["build"]);
})


gulp.task("default", ["build", "watch"]);
