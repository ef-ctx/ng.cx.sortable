var gulp = require('gulp'),
  clean = require('gulp-clean'),
  concat = require('gulp-concat'),
  less = require('gulp-less'),
  prettify = require('gulp-jsbeautifier'),
  jshint = require('gulp-jshint'),
  rename = require('gulp-rename'),
  template = require('gulp-template'),
  uglify = require('gulp-uglify'),
  path = require('path'),
  config = require('./build.config');

var env = 'dev';

gulp.task('clean', function () {
  return gulp.src([config.dev.target, config.dist.target], {read: false})
    .pipe(clean());
});


gulp.task('copy-lib', function () {
  return gulp.src(config.dev.jslibs, {base: '.'})
    .pipe(gulp.dest(config.dev.target));
});


gulp.task('build-css', function () {
  return gulp.src(config.less)
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest(config.dev.target));
});


gulp.task('jsbeautifier', function () {
  return gulp.src(config.js, {
      base: './'
    })
    .pipe(prettify({config: '.jsbeautifyrc', mode: 'VERIFY_AND_WRITE'}))
    .pipe(gulp.dest('./'));
});


gulp.task('jshint', function () {
  return gulp.src(config.js)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});


gulp.task('build-js', ['jshint', 'jsbeautifier'], function () {
  return gulp.src(config.js)
    .pipe(gulp.dest(config.dev.target));
});


gulp.task('build-index', function () {
  return gulp.src(config.tpl, {
      base: './src/example/'
    })
    .pipe(template({
      css: 'example/styles.css',
      jslibs: config.dev.jslibs,
      mainjs: config.dev.js
    }))
    .pipe(rename(function (path) {
      path.basename = 'index';
    }))
    .pipe(gulp.dest(config.dev.target));
});

gulp.task('concat-lib', function () {
  return gulp.src(config.dist.jslibs)
    .pipe(concat(config.dist.libsTarget))
    .pipe(gulp.dest(config.dist.target));
});

gulp.task('uglify-js', ['jshint', 'jsbeautifier'], function () {
  return gulp.src(config.dist.js)
    .pipe(uglify())
    .pipe(gulp.dest(config.dist.target));
});


gulp.task('build', [
  'copy-lib',
  'build-css',
  'build-js',
  'build-index'
]);

gulp.task('dist', [
  'concat-lib',
  'uglify-js'
]);

gulp.task('default', [
  'clean'
], function () {
  gulp.start('build');
});

gulp.task('watch', ['default'], function () {
    /**
     * @todo : make config
     */
    gulp.watch(config.less, ['build-css']);

    /**
     * @todo : make config
     */
    gulp.watch(config.js, ['build-js', 'build-index']);

    /**
     * @todo : make config
     */
    gulp.watch(config.tpl, ['build-index']);
});