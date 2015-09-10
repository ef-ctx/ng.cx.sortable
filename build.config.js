var config = {
    build: 'build/',
    defaults: {
        index: 'src/example/index.tpl.html',
        less: 'src/example/styles.less',
        js: 'src/ng.cx.sortable.js',
        css: 'styles.css'
    },
    prod: {},
    dev: {
        jslibs: [
            'components/angularjs/angular.js',
            'lib/greenstock/uncompressed/TweenLite.js',
            'lib/greenstock/uncompressed/TimelineMax.js',
            'lib/greenstock/uncompressed/CSSPlugin.js',
            'lib/greenstock/uncompressed/Draggable.js',
            'src/example/index.js'
        ],
        js: 'ng.cx.sortable.js'
    }
};

module.exports = config;