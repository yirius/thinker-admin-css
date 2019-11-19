/**
 * @Author: Yirius
 */
'use strict';

var gulp = require('gulp');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

var DEST = 'build/';

gulp.task('default', function() {
    return gulp.src('./static/thinker/config.js')
    // 这会输出一个未压缩过的版本
        .pipe(gulp.dest(DEST))
        // 这会输出一个压缩过的并且重命名未 foo.min.js 的文件
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest(DEST));
});
