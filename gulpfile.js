var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');
var coveralls = require('gulp-coveralls');

gulp.task('pre-test', function () {
  return gulp.src(['lib/**/*.js', '!lib/micro-whalla.js'])
    .pipe(istanbul({ includeUntested: true }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', ['lint', 'pre-test'], function () {
  return gulp.src('test/*.test.js')
    .pipe(mocha())
    .pipe(istanbul.writeReports());
});

gulp.task('lint', function () {
  return gulp.src(['**/*.js', '!node_modules/**', '!coverage/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('coveralls', function () {
  return gulp.src('coverage/**/lcov.info')
    .pipe(coveralls());
});

gulp.task('default', ['test'], function () {

});
