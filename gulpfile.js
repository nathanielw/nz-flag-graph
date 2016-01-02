'use strict';

var watchify = require('watchify');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var babel = require('babelify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign')
var sass = require('gulp-sass');
var del = require('del');
var uglify = require('gulp-uglify');

var opts = {
	dest: './dist'
}

var customBundleOpts = {
	entries: ['./src/js/index.js'],
	debug: true
};

var bundleOpts = assign({}, watchify.args, customBundleOpts);
var browserifyBundler = browserify(bundleOpts)
.transform(babel.configure({
	// Use all of the ES2015 spec
	presets: ['es2015']
}));

gulp.task('browserify', function () {
	return browserifyBundler.bundle()
		.on('error', gutil.log.bind(gutil, 'Browserify Error'))
		.pipe(source('bundle.js'))
		.pipe(buffer())
		.pipe(uglify())
		.pipe(gulp.dest(opts.dest + '/js'));
});

gulp.task('watchify', function() {

	var bundler = watchify(browserifyBundler);

	bundler.on('update', bundle);
	bundler.on('log', gutil.log);

	function bundle() {
		return bundler.bundle()
			.on('error', gutil.log.bind(gutil, 'Browserify Error'))
			.pipe(source('bundle.js'))
			.pipe(buffer())
			.pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
			.pipe(sourcemaps.write('./')) // writes .map file
			.pipe(gulp.dest(opts.dest + '/js'))
			.pipe(browserSync.stream({once: true}));
	}

	return bundle();
});

gulp.task('css', function() {
	return gulp.src('src/scss/*.scss')
		.pipe(sass({includePaths: ['./node_modules/'] }))
		.on('error', gutil.log.bind(gutil, 'Sass Error'))
		.pipe(gulp.dest(opts.dest + '/css'))
		.pipe(browserSync.reload({stream: true}));
});

gulp.task('html', function() {
	return gulp.src('src/*.html')
	.pipe(gulp.dest(opts.dest));
});

gulp.task('resources', function() {
	return gulp.src('src/resources/**/*')
	.pipe(gulp.dest(opts.dest + '/resources'));
});

gulp.task('clean', function() {
	del.sync(opts.dest + '/**/*');
});

gulp.task('serve', ['watchify', 'css'], function () {
	browserSync.init({
		open: false,
		server: ['./src', opts.dest]
	});

	gulp.watch('src/scss/**/*', ['css']);
	gulp.watch('src/**/*.html', browserSync.reload);
});

gulp.task('build', ['browserify', 'html', 'css', 'resources']);
