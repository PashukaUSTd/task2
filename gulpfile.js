const { src, dest, series, watch } = require('gulp');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber'); // Перезапускает локальный сервер, после исправления ошибки
const concat = require('gulp-concat'); // собирает все css файлы в один главный
const htmlMin = require('gulp-htmlmin'); // минимизирует html
const autoprefixes = require('gulp-autoprefixer'); //Вставляет в стили префиксы для поддерживаемости браузеров.
const cleanCss = require('gulp-clean-css'); // Очищает css от дублей и лишних штук
const svgSprite = require('gulp-svg-sprite'); // создает svg спрайты
const image = require('gulp-image'); //image minification
const babel = require('gulp-babel'); //Транспилятор JS
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps'); // Добавляет в минифицированные версии файлов sourcemap, которые, при возникновении ошибки ссылаются на исходный код
const uglify = require('gulp-uglify-es').default;
const del = require('del'); // удалить дирректорию
const gutil = require('gulp-util'); // Использую для определения продакш версии или версии для разработки
const noop = require('gulp-noop'); // Для тернарного оператора
const browserSync = require('browser-sync').create();

const prod = gutil.env.production; // при запуске сервера (gulp --production) возвращает true;
const dist = prod ? 'production/' : 'dist/';

const clean = () => {
    return del([dist])
}

const resources = () => {
    return src('src/resources/**')
        .pipe(dest(dist + 'resources'))
}

const styles = () => {
    return src('src/styles/**/*.css')
        .pipe(plumber())
        .pipe(prod ? noop() : sourcemaps.init())
        .pipe(concat('main.css'))
        .pipe(autoprefixes({
            cascade: false,
        }))
        .pipe(cleanCss({
            level: 2,
        }))
        .pipe(prod ? noop() : sourcemaps.write())
        .pipe(dest(dist))
        .pipe(browserSync.stream())
}

const pug2HtmlMinify = () => {
    return src('src/**/*.pug')
        .pipe(plumber())
        .pipe(pug())
        .pipe(htmlMin({
            collapseWhitespace: true,
        }))
        .pipe(dest(dist))
        .pipe(browserSync.stream())
}

const svgSprites = () => {
    return src('src/img/svg/**/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../sprite.svg',
                }
            }
        }))
        .pipe(dest(dist + 'images'))
}

const images = () => {
    return src([
        'src/img/**/*.jpg',
        'src/img/**/*.png',
        'src/img/**/*.jpeg',
        'src/img/*.svg',
    ])
        .pipe(image({})) // Дефолтные настройки
        .pipe(dest(dist + 'images'))
}

const scripts = () => {
    return src([
        'src/js/components/**/*.js',
        'src/js/main.js',
    ])
        .pipe(plumber())
        .pipe(prod ? noop() : sourcemaps.init())
        .pipe(babel({
            presets: ['@babel/env'],
        }))
        .pipe(concat('app.js'))
        .pipe(uglify({
            toplevel: true, //одна из настроек uglify, убирает все переменные и логику, и подставляет прямой эквивалент логике
            //в примере, в dev-file мы объявили переменную, присвоили ей значение 1 и затем вывели console.log(переменная)
            //что эквивалентно простой записи console.log(1). Эту настройку следует использовать аккуратно, так как она может повлияеть
            //на работу приложения.
        }).on('error', notify.onError()))
        .pipe(prod ? noop() : sourcemaps.write())
        .pipe(dest(dist))
        .pipe(browserSync.stream())
}

const watchFiles = () => {
    browserSync.init({
        server: {
            baseDir: 'dist',
        }
    })
}

watch('src/**/*.pug', pug2HtmlMinify);
watch('src/styles/**/*.css', styles);
watch('src/img/svg/**/*.svg', svgSprites)
watch('src/js/**/*.js', scripts)
watch('src/resources/**', resources)

exports.clean = clean;
exports.styles = styles;
exports.pug2HtmlMinify = pug2HtmlMinify;
exports.scripts = scripts;
exports.default = series(clean, styles, pug2HtmlMinify, svgSprites, images, scripts, resources, watchFiles);