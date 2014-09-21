var browserify = require('browserify');
var gulp = require('gulp');
var source = require("vinyl-source-stream");
var reactify = require('reactify');
var less = require('gulp-less');
var autoprefixer = require('gulp-autoprefixer');
var path = require('path');

gulp.task('js', function () {
  var b = browserify();
  b.transform(reactify); // use the reactify transform
  b.add('./public_src/js/main.react.js');
  return b.bundle()
    .pipe(source('./public/js/main.js'))
    .pipe(gulp.dest('.'));
});

gulp.task('less', function () {
  gulp.src('public_src/css/css.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(gulp.dest('public/css'));
});

gulp.task('copy', function () {
  gulp.src('public_src/bower_components/**/*')
    .pipe(gulp.dest('public/bower_components'));
  
  gulp.src('public_src/img/**/*')
    .pipe(gulp.dest('public/img'));
  
  gulp.src('public_src/*')
    .pipe(gulp.dest('public'));
  
});

gulp.task('watch', function () {
  gulp.watch('public_src/**/*', ['copy']);
  gulp.watch('public_src/css/**/*.less', ['less']);
  gulp.watch('public_src/js/**/*.js', ['js']);
});

gulp.task('default', ['copy', 'watch']);

