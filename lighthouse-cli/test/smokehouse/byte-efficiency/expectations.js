/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

// TODO(phulce): assert more score values once Lantern can tie more trace events back to images.
// See https://github.com/GoogleChrome/lighthouse/issues/4600.

/**
 * Expected Lighthouse audit values for byte efficiency tests
 */
module.exports = [
  {
    initialUrl: 'http://localhost:10200/byte-efficiency/tester.html',
    url: 'http://localhost:10200/byte-efficiency/tester.html',
    audits: {
      'unminified-css': {
        extendedInfo: {
          value: {
            wastedKb: 17,
            results: {
              length: 1,
            },
          },
        },
      },
      'unminified-javascript': {
        score: '<1.00',
        extendedInfo: {
          value: {
            wastedKb: 45,
            wastedMs: '>500',
            results: {
              length: 1,
            },
          },
        },
      },
      'unused-css-rules': {
        extendedInfo: {
          value: {
            wastedKb: 39,
            results: {
              length: 2,
            },
          },
        },
      },
      'unused-javascript': {
        score: '<1.00',
        extendedInfo: {
          value: {
            wastedKb: '>=25',
            wastedMs: '>500',
            results: {
              length: 2,
            },
          },
        },
      },
      'offscreen-images': {
        score: '<1.00', // big enough savings to interfere with download of script.js
        extendedInfo: {
          value: {
            results: [
              {
                url: /lighthouse-unoptimized.jpg$/,
              }, {
                url: /lighthouse-480x320.webp$/,
              }, {
                url: /lighthouse-480x320.webp\?invisible$/,
              }, {
                url: /large.svg$/,
              },
            ],
          },
        },
      },
      'uses-webp-images': {
        score: '<1.00', // big enough savings to interfere with download of script.js
        extendedInfo: {
          value: {
            wastedKb: '>60',
            wastedMs: '>200',
            results: {
              length: 4,
            },
          },
        },
      },
      'uses-optimized-images': {
        extendedInfo: {
          value: {
            wastedKb: '>10',
            results: {
              length: 1,
            },
          },
        },
      },
      'uses-responsive-images': {
        extendedInfo: {
          value: {
            wastedKb: '>50',
            wastedMs: '>100',
            results: {
              length: 3,
            },
          },
        },
      },
    },
  },
];
