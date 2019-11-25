/**
 * @Author: Yirius
 */
'use strict';

var pkg = require('./package.json');

var gulp = require('gulp');
var minify = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var header = require('gulp-header');
var pump = require('pump');

//上方的注释
var DEST = 'release/', note = [
    '/** <%= pkg.name %>-v<%= pkg.version %> <%= pkg.license %> License By <%= pkg.homepage %> */\n <%= js %>'
    ,{pkg: pkg, js: ';'}
];

var tasks = {
    copyJson: function(){
        gulp.src([
            "./static/json/**/*"
        ]).pipe(gulp.dest(DEST+"static/json/"));
    },
    copyLayui: function(){
        gulp.src([
            "./static/layui/**/*"
        ]).pipe(gulp.dest(DEST+"static/layui/"));
    },
    copyLogo: function(){
        gulp.src([
            "./static/logo/**/*",
        ]).pipe(gulp.dest(DEST+"static/logo/"));
    },
    copyThinker: function(){
        gulp.src([
            "./static/thinker/**/*",
            "!./static/thinker/css/thinker-default.css",
            "!./static/thinker/lay/modules/*",
            "!./static/thinker/lay/extends/tinymce.js",
            "!./static/thinker/lay/extends/excel.js",
            "!./static/thinker/lay/extends/echarsTheme.js",
            "!./static/thinker/lay/extends/md5.js",
            "!./static/thinker/lay/extends/helper.js",
            "!./static/thinker/lay/extends/protree.js",
            "!./static/thinker/lay/extends/tableplus.js",
        ]).pipe(gulp.dest(DEST+"static/thinker/"));
    },
    copyAdminHtml: function(){
        gulp.src([
            "./admin.html",
        ]).pipe(gulp.dest(DEST));
    },
    minCss: function(){
        gulp.src([
                "./static/thinker/css/thinker-default.css"
            ])
            .pipe(minify({
                compatibility: 'ie7'
            }))
            .pipe(header.apply(null, note))
            .pipe(gulp.dest(DEST+"static/thinker/css/"));
    },
    // minLayuiTable: function(){
    //     gulp.src([
    //             './static/layui/lay/modules/table.js',
    //             './static/layui/lay/modules/form.js'
    //         ])
    //         // 这会输出一个压缩过的并且重命名未 foo.min.js 的文件
    //         .pipe(uglify())
    //         .pipe(header.apply(null, note))
    //         .pipe(gulp.dest(DEST+"static/layui/lay/modules/"));
    // },
    minThinkerModules: function(){
        gulp.src('./static/thinker/lay/modules/*')
        // 这会输出一个压缩过的并且重命名未 foo.min.js 的文件
            .pipe(uglify())
            .pipe(header.apply(null, note))
            .pipe(gulp.dest(DEST+"static/thinker/lay/modules/"));
    },
    minThinkerExtends: function(){
        gulp.src([
                "./static/thinker/lay/extends/tinymce.js",
                "./static/thinker/lay/extends/excel.js",
                "./static/thinker/lay/extends/echarsTheme.js",
                "./static/thinker/lay/extends/md5.js",
                "./static/thinker/lay/extends/helper.js",
                "./static/thinker/lay/extends/protree.js",
                "./static/thinker/lay/extends/tableplus.js",
            ])
            .pipe(uglify())
            .pipe(header.apply(null, note))
            .pipe(gulp.dest(DEST+"static/thinker/lay/extends/"));
    }
};

/**
 * 清理构建文件夹
 */
gulp.task('clean:build', function(cb){
    pump([
        gulp.src(DEST),
        clean()
    ], cb);
});

gulp.task('default', ['clean:build'], function(){
    for(var key in tasks){
        tasks[key]('open');
    }
});
