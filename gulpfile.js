var gulp = require('gulp'),
	uglify = require("gulp-uglify"),
	jshint = require("gulp-jshint"),
	rename = require("gulp-rename"),
	less = require("gulp-less"),
	LessPluginCleanCSS = require('less-plugin-clean-css'),
	cleancss = new LessPluginCleanCSS({ advanced: true }),
	LessPluginAutoPrefix = require('less-plugin-autoprefix'),
	autoprefixer = new LessPluginAutoPrefix({ browsers: ["last 2 versions"] });

// JS
gulp.task('js', function () {
	gulp.src(['dashboard/assets/js/**/*.js', '!dashboard/assets/js/**/*.min.js'])
		.pipe(jshint())
		.pipe(jshint.reporter())
		.pipe(uglify().on('error', function(err){ console.log(err.message); }))
		.pipe(rename({ suffix: ".min" }))
		.pipe(gulp.dest('dashboard/assets/js'));
});

// Less
gulp.task('less', function () {
	gulp.src('dashboard/assets/less/style.less')
		.pipe(less({
			plugins: [autoprefixer, cleancss]
		}).on('error', function(err){ console.log(err.message); }))
		.pipe(gulp.dest('dashboard/assets/css'));
});

// ncg-dash
gulp.task('ncg-dash', function () {
	gulp.src('dashboard/ncg-dash/style.less')
		.pipe(less({
			plugins: [autoprefixer, cleancss]
		}).on('error', function(err){ console.log(err.message); }))
		.pipe(gulp.dest('dashboard/ncg-dash'));
});

// Watchers
gulp.task('watch', function () {
	gulp.watch(['dashboard/assets/js/**/*.js', '!dashboard/assets/js/**/*.min.js'], ['js']);
	gulp.watch(['dashboard/assets/less/*'], ['less']);
	gulp.watch(['dashboard/ncg-dash/*', '!dashboard/ncg-dash/*.css'], ['ncg-dash']);
});

gulp.task('default', ['watch']);