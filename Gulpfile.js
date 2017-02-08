'use strict';

require('dotenv').config();

var gulp    = require('gulp');
var gutil   = require('gulp-util');

// Load plugins:
var plugins = require('gulp-load-plugins')({
  pattern: [
    'gulp-*',
    'gulp.*',
    'browserify',
    'babelify',
    'vinyl-source-stream',
    'vinyl-buffer',
    'browser-sync'
  ],
  rename: {
    'gulp-sourcemaps': 'sourcemaps'
  }
});

// Source and destination paths for tasks:
var path = {
  src:   'src',
  dest:  'public_html',
  npm:   'node_modules',
  // Path to /app/public on the staging environment (for rsync):
  stage: 'user@servername:/path/to/site/app/public'
};

/**
 * $ gulp
 *
 * - compile, autoprefix, and minify Sass
 * - bundle Javascript
 * - optimise images (including SVGs)
 * - create custom Modernizr build
 */
gulp.task('default', [
  'styles',
  'scripts',
  'images',
  'modernizr'
]);

/**
 * $ gulp watch:tasks
 *
 * - watch for updates to scripts, styles, and Gulpfile
 * - process files appropriately on change
 */
gulp.task('watch:tasks', ['default'], function(){
  // Gulpfile.js:
  gulp.watch('Gulpfile.js', []);

  // Scripts:
  gulp.watch(path.src + '/scripts/**/*.js', ['scripts']);

  // Styles:
  gulp.watch(path.src + '/styles/**/*.scss', [
    'styles'
  ]);

  // Images:
  gulp.watch(path.src + '/images/{,*/}*.{gif,jpg,png,svg}', [
    'images'
  ]);
});



/**
 * $ gulp watch
 *
 * - calls 'gulp watch:tasks' using Browsersync for live updating
 */
gulp.task('watch', ['watch:tasks'], function() {
  // Connect to craft.dev via BrowserSync:
  plugins.browserSync.init({
    open: false,
    proxy: "colesserveup.local"
  });

  // Do a full page reload when any templates are updated:
  gulp.watch([
    './craft/templates/**/*',
    './src/craft/templates/**/*'
  ])
  .on('change', plugins.browserSync.reload);
});

/**
 * $ gulp images
 *
 * - Optimise images (new and updated images only)
 */
gulp.task('images', function(){
  var src  = path.src  + '/images/{,*/}*.{gif,jpg,png,svg}';
  var dest = path.dest + '/images';

  return gulp.src(src)
    // Only process new / updated images:
    .pipe(plugins.newer(dest))
    // Minify images:
    .pipe(plugins.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [
        { cleanupIDs: false },
        { removeDoctype: false } // Keeps IE happy
      ]
    }))
    .pipe(gulp.dest(dest));
});

/**
 * $ gulp styles
 *
 * - Compile Sass --> CSS, autoprefix, and minify
 */
gulp.task('styles', function(){
  gulp.src(path.src + '/styles/main.scss')
    .pipe(plugins.sourcemaps.init())
    // Compile Sass:
    .pipe(plugins.sass.sync({
        includePaths: [
          path.npm + '/bootstrap-sass/assets/stylesheets',
          path.npm + '/node.normalize.scss'
        ]
      })
      .on('error', plugins.sass.logError)
    )
    // Autoprefix:
    .pipe(plugins.autoprefixer({
      browsers: [
        'last 3 versions',
        'ie 8',
        'ie 9'
      ]
    }))
    .pipe(plugins.sourcemaps.write('./'))
    // Write main.css
    .pipe(gulp.dest(path.dest + '/styles'))
    // Report file size:
    .pipe(plugins.size({ showFiles: true }))
    // Minify main.css and rename it to 'main.min.css':
    .pipe(plugins.cssmin())
    .pipe(plugins.rename({suffix: '.min'}))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(gulp.dest(path.dest + '/styles'))
    .pipe(plugins.browserSync.stream())
    .on('error', gutil.log);
});

/**
 * $ gulp scripts
 *
 * - Bundle Javascript and concatenate
 */
gulp.task('scripts', function(){
  gulp.src([
    path.src + '/scripts/vendor/fastclick.js',
    path.src + '/scripts/vendor/materialize.js',
    path.src + '/scripts/vendor/jquery-ui.min.js',
    path.src + '/scripts/vendor/jquery.validate.js',
    path.src + '/scripts/main.js',
    ])
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.concat('main.js'))
      .pipe(gulp.dest(path.dest + '/scripts'))
      .pipe(plugins.rename('main.min.js'))
      .pipe(plugins.uglify())
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest(path.dest + '/scripts'))
      .pipe(plugins.size({ showFiles: true }));
});

/**
 * $ gulp jshint
 *
 * - lint Javascript files and Gulpfile.js
 */
gulp.task('jshint', function(){
  var src  = [
    'Gulpfile.js',
    path.src  + '/scripts/{,*/}*.js'
  ];

  gulp.src(src)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter(require('jshint-stylish')));
});

/**
 * $ gulp modernizr
 *
 * - create a custom Modernizr build based on tests used
 *   in bundle.js and main.css
 */
gulp.task('modernizr', function(){
  var src = [
    path.dest + '/scripts/bundle.js',
    path.dest + '/styles/main.css'
  ];

  gulp.src(src)
    .pipe(plugins.modernizr({
      options: [
        'setClasses'
      ]
    }))
    .pipe(plugins.uglify())
    .pipe(gulp.dest(path.dest + '/scripts'))
    .pipe(plugins.size({ showFiles: true }))
    .on('error', gutil.log);
});

/**
 * $ gulp db:restore
 *
 * - restore db from latest backup
 * - this is just a more user-friendly wrapper for
 *   `vagrant provision --provision-with shell`
 */
gulp.task('db:restore', function(){
  require('child_process')
    .exec('vagrant provision --provision-with shell', function(err, stdout, stderr){
      stdout && gutil.log(gutil.colors.green(stdout));
      stderr && gutil.log(gutil.colors.red(stderr));
    });
});

/**
 * $ gulp rsync:fromstage
 * $ gulp rsync:tostage
 *
 * - Sync assets from/to remote site
 */
function syncFiles(src, dest) {
  var rsync = require('rsyncwrapper');
  var opts = {
    src:  src,
    dest: dest,
    args: [
      '--archive',
      '--compress',
      '--stats',
      '--verbose'
    ],
    delete: false,
    exclude: ['.git*','*.scss','node_modules'],
    ssh:  true,
    recursive: true,
    compareMode: 'checksum'
  };

  rsync(opts, function(err, stdout) {
    gutil.log(stdout);
  });
}

// From stage to local:
gulp.task('rsync:fromstage', function(){
  var src  = path.stage + '/assets/';
  var dest = path.dest  + '/assets/';

  syncFiles(src, dest);
});

// From local to stage:
gulp.task('rsync:tostage', function(){
  var src  = path.dest  + '/assets/';
  var dest = path.stage + '/assets/';

  syncFiles(src, dest);
});
