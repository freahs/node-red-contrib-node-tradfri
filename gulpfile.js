var gulp = require('gulp');
var del = require('del');
var shell = require('gulp-shell');
var ts = require('gulp-typescript');

gulp.task('clean:build', () => {
    return del(['./build/**']);
});

gulp.task('compile', gulp.series('clean:build', () => {
    let numErrors = 0;
    let res = gulp.src('src/**/*.ts')
        .pipe(
            ts({
               module: 'commonjs',
               target: 'es2015',
               declaration: true
            })
        )
        .on('error', () => {
            numErrors += 1;
        })
    return res.pipe(gulp.dest('build'))
}));

gulp.task('install', gulp.series('compile', () => {
    return gulp.src(['src/*.html', 'build/*.js'])
        .pipe(gulp.dest('dist'));
}));

gulp.task('exec', gulp.series('install', shell.task('docker restart node-red')));

gulp.task('watch', function() {
    return gulp.watch(['src/*.html', 'src/*.ts'], ['exec']);
});

gulp.task('default', gulp.series('install'));
