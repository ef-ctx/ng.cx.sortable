var config = {
    dist: {
        target: 'dist/',
        libsTarget: 'greenstock.js',
        jslibs: [
            'vendor/gsap/src/minified/TweenLite.min.js',
            'vendor/gsap/src/minified/TimelineMax.min.js',
            'vendor/gsap/src/minified/plugins/CSSPlugin.min.js',
            'vendor/gsap/src/minified/Draggable.min.js',
        ],
        js: ['src/ng.cx.sortable.js']
    },
    dev: {
        target: 'build/',
        jslibs: [
            'vendor/angularjs/angular.js',
            'vendor/gsap/src/uncompressed/TweenLite.js',
            'vendor/gsap/src/uncompressed/TimelineMax.js',
            'vendor/gsap/src/uncompressed/plugins/CSSPlugin.js',
            'vendor/gsap/src/uncompressed/utils/Draggable.js'
        ],
        js: ['ng.cx.sortable.js', 'example/index.js']
    },

    less: ['src/**/*.less'],
    js: ['src/*.js', 'src/**/*.js'],
    tpl: ['src/**/*.tpl.html']
};

module.exports = config;
