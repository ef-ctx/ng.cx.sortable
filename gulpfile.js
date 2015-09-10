var gulp = require('gulp'),
  clean = require('gulp-clean'),
  less = require('gulp-less'),
  prettify = require('gulp-jsbeautifier'),
  jshint = require('gulp-jshint'),
  rename = require('gulp-rename'),
  template = require('gulp-template'),
  path = require('path'),
  config = require('./build.config');


gulp.task('clean', function () {
  return gulp.src([config.build], {read: false})
    .pipe(clean());
});


gulp.task('copy-lib', function () {
  return gulp.src(config.dev.jslibs, {base: '.'})
    .pipe(gulp.dest(config.build));
});


gulp.task('build-css', function () {
  return gulp.src(config.defaults.less)
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(gulp.dest(config.build));
});


gulp.task('jsbeautifier', function () {
  return gulp.src(config.defaults.js, {
      base: './'
    })
    .pipe(prettify({config: '.jsbeautifyrc', mode: 'VERIFY_AND_WRITE'}))
    .pipe(gulp.dest('./'));
});


gulp.task('jshint', function () {
  return gulp.src(config.defaults.js)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});


gulp.task('build-js', ['jshint', 'jsbeautifier'], function () {
  return gulp.src(config.defaults.js)
    .pipe(gulp.dest(config.build));
});


gulp.task('build-index', function () {
  return gulp.src(config.defaults.index)
    .pipe(template({
      css: config.defaults.css,
      jslibs: config.dev.jslibs,
      mainjs: config.dev.js
    }))
    .pipe(rename(function (path) {
      path.basename = 'index';
    }))
    .pipe(gulp.dest(config.build));
});


gulp.task('build', [
  'copy-lib',
  'build-css',
  'build-js',
  'build-index'
]);

gulp.task('default', [
  'clean'
], function () {
  gulp.start('build');
});