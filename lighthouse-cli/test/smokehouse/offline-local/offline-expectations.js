/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Expected Lighthouse results from testing the defaut audits on local test
 * pages, one of which works offline with a service worker and one of which does
 * not.
 */
module.exports = [
  {
    initialUrl: 'http://localhost:10200/online-only.html',
    url: 'http://localhost:10200/online-only.html',
    audits: {
      'is-on-https': {
        score: 1,
      },
      'redirects-http': {
        score: 0,
      },
      'service-worker': {
        score: 0,
      },
      'works-offline': {
        score: 0,
      },
      'viewport': {
        score: 1,
      },
      'without-javascript': {
        score: 1,
      },
      'user-timings': {
        score: 1,
        displayValue: '',
      },
      'critical-request-chains': {
        score: 1,
        displayValue: '',
      },
      'webapp-install-banner': {
        score: 0,
      },
      'splash-screen': {
        score: 0,
      },
      'themed-omnibox': {
        score: 0,
      },
      'aria-valid-attr': {
        notApplicable: true,
      },
      'aria-allowed-attr': {
        notApplicable: true,
      },
      'color-contrast': {
        score: 1,
      },
      'image-alt': {
        notApplicable: true,
      },
      'label': {
        notApplicable: true,
      },
      'tabindex': {
        notApplicable: true,
      },
      'content-width': {
        score: 1,
      },
    },
  },

  {
    initialUrl: 'http://localhost:10503/offline-ready.html',
    url: 'http://localhost:10503/offline-ready.html',
    audits: {
      'is-on-https': {
        score: 1,
      },
      'redirects-http': {
        score: 0,
      },
      'service-worker': {
        score: 1,
      },
      'works-offline': {
        score: 1,
      },
      'viewport': {
        score: 1,
      },
      'without-javascript': {
        score: 1,
      },
      'user-timings': {
        score: 1,
        displayValue: '',
      },
      'critical-request-chains': {
        score: 1,
        displayValue: '',
      },
      'webapp-install-banner': {
        score: 0,
      },
      'splash-screen': {
        score: 0,
      },
      'themed-omnibox': {
        score: 0,
      },
      'aria-valid-attr': {
        notApplicable: true,
      },
      'aria-allowed-attr': {
        notApplicable: true,
      },
      'color-contrast': {
        score: 1,
      },
      'image-alt': {
        score: 0,
      },
      'label': {
        notApplicable: true,
      },
      'tabindex': {
        notApplicable: true,
      },
      'content-width': {
        score: 1,
      },
    },
  },
];
