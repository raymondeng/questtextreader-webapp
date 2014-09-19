var browserify = require('browserify');
var gulp = require('gulp');
var source = require("vinyl-source-stream");
var reactify = require('reactify');

gulp.task('browserify', function () {
  var b = browserify();
  b.transform(reactify); // use the reactify transform
  b.add('./public_src/js/main.react.js');
  return b.bundle()
    .pipe(source('./public/js/main.js'))
    .pipe(gulp.dest('.'));
});

gulp.task('copy', function () {
  gulp.src('public_src/bower_components/**/*')
    .pipe(gulp.dest('public/bower_components'));
  
  gulp.src('public_src/css/*')
    .pipe(gulp.dest('public/css'));
  
  gulp.src('public_src/*')
    .pipe(gulp.dest('public'));
});

gulp.task('watch', function () {
  gulp.watch('public_src/**/*', ['copy']);
  gulp.watch('public_src/js/**/*.js', ['browserify'])
});

gulp.task('default', ['copy', 'watch']);

