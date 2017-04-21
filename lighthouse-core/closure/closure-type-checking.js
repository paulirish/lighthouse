#!/usr/bin/env node
/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const closureCompiler = require('google-closure-compiler').gulp();
const gulp = require('gulp');
const gutil = require('gulp-util');
const replace = require('gulp-replace');

// Flags to generate additional debug information.
const PRINT_AST = false;
const PRINT_CODE = !PRINT_AST && false;
const OUTPUT_FILE = PRINT_AST ? '../closure-tree.txt' : 'closure-output.js';

/* eslint-disable camelcase */
gulp.task('compile-report', () => {
  return gulp.src([
    // externs
    'closure/third_party/commonjs.js',

    'report/v2/renderer/*.js',
  ])

  // Ignore `module.exports` and `self.ClassName = ClassName` statements.
  .pipe(replace(/^\s\smodule\.exports = \w+;$/gm, ';'))
  .pipe(replace(/^\s\sself\.(\w+) = \1;$/gm, ';'))

  .pipe(closureCompiler({
    compilation_level: 'SIMPLE',
    // new_type_inf: true,
    language_in: 'ECMASCRIPT6_STRICT',
    language_out: 'ECMASCRIPT5_STRICT',
    warning_level: process.env.CI ? 'QUIET' : 'VERBOSE',
    jscomp_error: [
      'checkTypes',
    ],
    jscomp_warning: [
      // https://github.com/google/closure-compiler/wiki/Warnings
      'accessControls',
      'checkRegExp',
      'const',
      'reportUnknownTypes',
      'missingProperties',
      'missingReturn',
      'strictModuleDepCheck',
      'typeInvalidation',
      'undefinedNames',
      'visibility',

      'checkDebuggerStatement',
      'externsValidation',
      'uselessCode',
      'ambiguousFunctionDecl',
      'checkTypes',
      'es3',
      'es5Strict',
      'globalThis',
      'nonStandardJsDocs',
      'suspiciousCode',
      'unknownDefines',

      // nullable/undefined checker when new_type_inf enabled.
      'newCheckTypesAllChecks',
    ],
    conformance_configs: 'closure/conformance_config.textproto',

    // Debug output control.
    checks_only: !PRINT_CODE,
    print_tree: PRINT_AST,
    js_output_file: OUTPUT_FILE,
    formatting: 'PRETTY_PRINT',
    preserve_type_annotations: true,
  }))
  .pipe(gulp.dest('../'))
  .on('end', () => {
    gutil.log('Closure compilation successful.');
  });
});

/* eslint-enable */

gulp.start('compile-report');
