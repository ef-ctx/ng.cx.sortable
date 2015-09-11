var config = {
    dist: {
        target: 'dist/',
        libsTarget: 'greenstock.js',
        jslibs: [
            'lib/greenstock/minified/TweenLite.min.js',
            'lib/greenstock/minified/TimelineMax.min.js',
            'lib/greenstock/minified/CSSPlugin.min.js',
            'lib/greenstock/minified/Draggable.min.js',
        ],
        js: ['src/ng.cx.sortable.js']
    },
    dev: {
        target: 'build/',
        jslibs: [
            'components/angularjs/angular.js',
            'lib/greenstock/uncompressed/TweenLite.js',
            'lib/greenstock/uncompressed/TimelineMax.js',
            'lib/greenstock/uncompressed/CSSPlugin.js',
            'lib/greenstock/uncompressed/Draggable.js'
        ],
        js: ['ng.cx.sortable.js', 'example/index.js']
    },

    less: ['src/**/*.less'],
    js: ['src/*.js', 'src/**/*.js'],
    tpl: ['src/**/*.tpl.html']
};

module.exports = config;