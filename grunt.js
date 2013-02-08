"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*\n * <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n' +
              ' * built <%= grunt.template.today("yyyy-mm-dd") %>\n' +
              '<%= pkg.homepage ? " * " + pkg.homepage + "\n" : "" %>' +
              ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
              ' * Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %>\n */'
    },
    test: {
      unit: ['test/unit/*.js'],
      integration: ['test/integration/*.js']
    },
    lint: {
      files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', '<file_strip_banner:lib/force.js>'],
        dest: 'dist/force-<%= pkg.version %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/force-<%= pkg.version %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'default'
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        node: true
      },
      globals: {
        exports: true
      }
    }
  });

  grunt.registerTask('dist','concat min');

  // Default task.
  grunt.registerTask('default', 'lint test dist');

};
