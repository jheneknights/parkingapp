module.exports = function(grunt) {
    grunt.initConfig({
        // See: http://www.jshint.com/docs/
        jshint: {
            client: {
                src: 'application/**/*.js',
                options: {
                    bitwise: false,
                    camelcase: false,
                    curly: true,
                    eqeqeq: false,
                    forin: true,
                    immed: true,
                    indent: 4,
                    latedef: false,
                    newcap: true,
                    noarg: true,
                    noempty: true,
                    nonew: true,
                    quotmark: 'double',
                    regexp: true,
                    undef: true,
                    unused: true,
                    trailing: true,
                    maxlen: 120,
                    jquery: true,
                    browser: true,
                    eqnull: true
                }
            },
            server: {
                src: 'routes/**/*.js',
                options: {
                    bitwise: false,
                    camelcase: false,
                    curly: true,
                    eqeqeq: false,
                    forin: true,
                    immed: true,
                    indent: 4,
                    latedef: false,
                    newcap: true,
                    noarg: true,
                    noempty: true,
                    nonew: true,
                    quotmark: 'double',
                    regexp: true,
                    undef: true,
                    unused: true,
                    trailing: true,
                    maxlen: 120,
                    node: true
                }
            }
        },
        watch: {
            jshint: {
                files: ['application/**/*.js', 'routes/**/*.js'],
                tasks: 'jshint'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    //Task to run when grunt is triggered in the CLi
    grunt.registerTask('default', ['jshint']);
};