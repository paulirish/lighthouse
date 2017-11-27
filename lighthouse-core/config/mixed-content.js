/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

module.exports = {
  // We perform two passes:
  // (1) Gather the default resources requested by the page, and
  // (2) Re-load page but attempt to upgrade each request to HTTPS.
  passes: [{
    passName: 'defaultPass',
    recordTrace: true,
    gatherers: ['url'],
  }, {
    passName: 'mixedContentPass',
    recordTrace: true,
    gatherers: ['mixed-content'],
  }],

  audits: [
    'mixed-content',
  ],

  categories: {
    mixedContent: {
      name: 'Mixed Content',
      description: 'These audits check which resources support HTTPS and ' +
        'which are potentially blocking the page from switching to HTTPS.',
      audits: [
        {id: 'mixed-content', weight: 1},
      ],
    },
  },
};
