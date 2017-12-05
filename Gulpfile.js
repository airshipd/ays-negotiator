'use strict';

require('dotenv').config();

var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpsync = require('gulp-sync')(gulp);

// Load plugins:
var plugins = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'babelify',
    'vueify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'browser-sync'
  ],
  rename: {
    'gulp-sourcemaps': 'sourcemaps',
    'vinyl-source-stream': 'source',
    'vinyl-buffer': 'buffer'
  }
});

// Source and destination paths for tasks:
var path = {
  src: 'src',
  dest: 'public_html',
  npm: 'node_modules',
  // Path to /app/public on the staging environment (for rsync):
  stage: 'user@servername:/path/to/site/app/public'
};

/**
 * $ gulp watch:tasks
 *
 * - watch for updates to scripts, styles, and Gulpfile
 * - process files appropriately on change
 */
gulp.task('watch:tasks', ['default'], function() {
  // Scripts:
  gulp.watch(path.src + '/scripts/main/**/*.js', ['scripts']);

  // Vue js main
  gulp.watch([path.src + '/scripts/apps/**/*.js', path.src + '/scripts/apps/**/*.vue'], ['js-vue']);

  // Styles:
  gulp.watch(path.src + '/styles/**/*.scss', ['styles']);

  // Images:
  gulp.watch(path.src + '/images/{,*/}*.{gif,jpg,png,svg}', ['images']);

  // Craft templates:
  gulp.watch(['./craft/templates/**/*', './src/craft/templates/**/*']).on('change', plugins.browserSync.reload)
});

/**
 * $ gulp watch
 *
 * - calls 'gulp watch:tasks' using Browsersync for live updating
 */
gulp.task('watch', ['watch:tasks'], function() {
  return plugins.browserSync.init({
    // open: true,
    // injectChanges: true,
  });
});

/**
 * $ gulp images
 *
 * - Optimise images (new and updated images only)
 */
gulp.task('images', function() {
  var src = path.src + '/images/{,*/}*.{gif,jpg,png,svg}';
  var dest = path.dest + '/images';

  return (gulp
      .src(src)
      // Only process new / updated images:
      .pipe(plugins.newer(dest))
      // Minify images:
      .pipe(
        plugins.imagemin({
          progressive: true,
          interlaced: true,
          svgoPlugins: [
            { cleanupIDs: false },
            { removeDoctype: false } // Keeps IE happy
          ]
        })
      )
      .pipe(gulp.dest(dest)) )
      .pipe(plugins.browserSync.stream());
});

/**
 * $ gulp styles
 *
 * - Compile Sass --> CSS, autoprefix, and minify
 */
gulp.task('styles', function() {
  return gulp
    .src(path.src + '/styles/main.scss')
    .pipe(plugins.sourcemaps.init())
    // Compile Sass:
    .pipe(
      plugins.sass
        .sync({
          includePaths: [
            path.npm + '/bootstrap-sass/assets/stylesheets',
            path.npm + '/node.normalize.scss'
          ]
        })
        .on('error', plugins.sass.logError)
    )
    // Autoprefix:
    .pipe(
      plugins.autoprefixer({
        browsers: ['last 3 versions', 'ie 8', 'ie 9']
      })
    )
    .pipe(plugins.sourcemaps.write('./'))
    // Write main.css
    .pipe(gulp.dest(path.dest + '/styles'))
    // Report file size:
    .pipe(plugins.size({ showFiles: true }))
    .pipe(plugins.cssmin())
    .pipe(plugins.browserSync.stream())
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(gulp.dest(path.dest + '/styles'))
    .pipe(plugins.browserSync.stream());
});

/**
 * $ gulp scripts
 *
 * - Bundle Javascript and concatenate
 */
gulp.task('scripts', function() {
  return gulp
    .src([
      path.src + '/scripts/main/vendor/fastclick.js',
      path.src + '/scripts/main/vendor/materialize.js',
      path.src + '/scripts/main/vendor/jquery-ui.min.js',
      path.src + '/scripts/main/vendor/jquery.validate.js',
      path.src + '/scripts/main/vendor/jquery.jCounter-0.1.4.js',
      path.src + '/scripts/main/vendor/jquery.inputmask.bundle.js',
      path.src + '/scripts/main/vendor/jquery.matchHeight.js',
      path.src + '/scripts/main/vendor/nouislider.js',
      path.src + '/scripts/main/vendor/signature_pad.js',
      path.src + '/scripts/main/vendor/jsPDF.js',
      path.src + '/scripts/main/modules/*',
      path.src + '/scripts/main/vendor/jquery.countdown.js',
      path.src + '/scripts/main/main.js'
    ])
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('main.js'))
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.rename('main.min.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(plugins.browserSync.stream());
});


/**
 * $ gulp Vue app js
 *
 * -
 */
gulp.task('js-vue', function() {
	let b = plugins.browserify('src/scripts/apps/index.js', { debug: true })
  .transform(["vueify", { "presets": ["es2015", "stage-2"] }])
  return b.bundle()
  .on('error', function(err){
    // print the error (can replace with gulp-util)
    console.log(err.message);
    // end this stream
    this.emit('end');
  })
	.pipe(plugins.source('app.js'))
	.pipe(plugins.buffer())
	.pipe(plugins.sourcemaps.init({
		loadMaps: false
	}))
	.pipe(plugins.sourcemaps.write('.'))
  .pipe(gulp.dest(path.dest + '/scripts'))
  .pipe(plugins.browserSync.stream());
});


/**
 * $ gulp scripts
 *
 * - Bundle Javascript and concatenate
 */
gulp.task('js-vue-jquery-scripts', function() {
  return gulp
    .src([
      path.src + '/scripts/main/vendor/fastclick.js',
      path.src + '/scripts/main/vendor/materialize.js',
      path.src + '/scripts/main/vendor/jquery-ui.min.js',
      path.src + '/scripts/main/vendor/jquery.validate.js',
      path.src + '/scripts/main/vendor/jquery.jCounter-0.1.4.js',
      path.src + '/scripts/main/vendor/jquery.inputmask.bundle.js',
      path.src + '/scripts/main/vendor/jquery.matchHeight.js',
      path.src + '/scripts/main/vendor/nouislider.js',
      path.src + '/scripts/main/vendor/signature_pad.js',
      path.src + '/scripts/main/vendor/jsPDF.js',
      path.src + '/scripts/main/vendor/jquery.countdown.js',
      // path.src + '/scripts/main/modules/*',
    ])
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.concat('vue-jquery-plugins.js'))
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.rename('vue-jquery-plugins.min.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(plugins.browserSync.stream());
});

/**
 * $ gulp
 *
 * - compile, autoprefix, and minify Sass
 * - bundle Javascript
 * - optimise images (including SVGs)
 * - create custom Modernizr build
 */
gulp.task('default', gulpsync.sync(['styles', 'scripts', 'js-vue', 'js-vue-jquery-scripts', 'images']));
