/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * Expected Lighthouse audit values for Do Better Web tests.
 */
module.exports = [
  {
    initialUrl: 'http://localhost:10200/dobetterweb/dbw_tester.html',
    url: 'http://localhost:10200/dobetterweb/dbw_tester.html',
    audits: {
      'errors-in-console': {
        score: 0,
        rawValue: '>3',
        details: {
          items: {
            length: '>3',
          },
        },
      },
      'is-on-https': {
        score: 0,
        extendedInfo: {
          value: {
            length: 1,
          },
        },
      },
      'uses-http2': {
        score: 0,
        extendedInfo: {
          value: {
            results: {
              length: 18,
            },
          },
        },
        details: {
          items: {
            length: 18,
          },
        },
      },
      'external-anchors-use-rel-noopener': {
        score: 0,
        debugString: 'Lighthouse was unable to determine the destination of some anchor tags. ' +
                     'If they are not used as hyperlinks, consider removing the _blank target.',
        extendedInfo: {
          value: {
            length: 3,
          },
        },
        details: {
          items: {
            length: 3,
          },
        },
      },
      'appcache-manifest': {
        score: 0,
        debugString: 'Found <html manifest="clock.appcache">.',
      },
      'geolocation-on-start': {
        score: 0,
      },
      'link-blocking-first-paint': {
        score: 0,
        rawValue: '<3000',
        extendedInfo: {
          value: {
            results: {
              length: 5,
            },
          },
        },
        details: {
          items: {
            length: 5,
          },
        },
      },
      'no-document-write': {
        score: 0,
        extendedInfo: {
          value: {
            length: 3,
          },
        },
        details: {
          items: {
            length: 3,
          },
        },
      },
      'no-mutation-events': {
        score: 0,
        extendedInfo: {
          value: {
            results: {
              length: 6,
            },
          },
        },
        details: {
          items: {
            length: 6,
          },
        },
      },
      'no-vulnerable-libraries': {
        score: 0,
        details: {
          items: {
            length: 1,
          },
        },
      },
      'no-websql': {
        score: 0,
        debugString: 'Found database "mydb", version: 1.0.',
      },
      'notification-on-start': {
        score: 0,
      },
      'script-blocking-first-paint': {
        score: '<1.00',
        extendedInfo: {
          value: {
            results: {
              length: 2,
            },
          },
        },
        details: {
          items: {
            length: 2,
          },
        },
      },
      'uses-passive-event-listeners': {
        score: 0,
        extendedInfo: {
          value: {
            // Note: Originally this was 7 but M56 defaults document-level
            // listeners to passive. See https://www.chromestatus.com/features/5093566007214080
            // Note: It was 4, but {passive:false} doesn't get a warning as of M63: crbug.com/770208
            // COMPAT: This can be set to 3 when m63 is stable.
            length: '>=3',
          },
        },
      },
      'deprecations': {
        score: 0,
        extendedInfo: {
          value: {
            length: 3,
          },
        },
        details: {
          items: {
            length: 3,
          },
        },
      },
      'password-inputs-can-be-pasted-into': {
        score: 0,
        extendedInfo: {
          value: {
            length: 2,
          },
        },
      },
      'image-aspect-ratio': {
        score: 0,
        details: {
          items: {
            0: {
              displayedAspectRatio: /^480 x 57/,
            },
            length: 1,
          },
        },
      },
    },
  }, {
    initialUrl: 'http://localhost:10200/dobetterweb/domtester.html?smallDOM',
    url: 'http://localhost:10200/dobetterweb/domtester.html?smallDOM',
    audits: {
      'dom-size': {
        score: 1,
        extendedInfo: {
          value: {
            0: {value: '1,324'},
            1: {value: '7'},
            2: {value: '1,303'},
          },
        },
        details: {
          items: {
            0: {value: '1,324'},
            1: {value: '7'},
            2: {value: '1,303'},
          },
        },
      },
    },
  }, {
    initialUrl: 'http://localhost:10200/dobetterweb/domtester.html?largeDOM&withShadowDOM',
    url: 'http://localhost:10200/dobetterweb/domtester.html?largeDOM&withShadowDOM',
    audits: {
      'dom-size': {
        score: 0,
        extendedInfo: {
          value: {
            0: {value: '6,037'},
            1: {value: '9'},
            2: {value: '6,003'},
          },
        },
        details: {
          items: {
            0: {value: '6,037'},
            1: {value: '9'},
            2: {value: '6,003'},
          },
        },
      },
    },
  }, {
    initialUrl: 'http://localhost:10200/dobetterweb/domtester.html?withShadowDOM',
    url: 'http://localhost:10200/dobetterweb/domtester.html?withShadowDOM',
    audits: {
      'dom-size': {
        score: 1,
        extendedInfo: {
          value: {
            0: {value: '37'},
            1: {value: '9'},
            2: {value: '9'},
          },
        },
        details: {
          items: {
            0: {value: '37'},
            1: {value: '9'},
            2: {value: '9'},
          },
        },
      },
    },
  }, {
    initialUrl: 'http://localhost:10200/dobetterweb/domtester.html?ShadowRootWithManyChildren',
    url: 'http://localhost:10200/dobetterweb/domtester.html?ShadowRootWithManyChildren',
    audits: {
      'dom-size': {
        score: 1,
        extendedInfo: {
          value: {
            0: {value: '33'},
            1: {value: '7'},
            2: {value: '9'},
          },
        },
        details: {
          items: {
            0: {value: '33'},
            1: {value: '7'},
            2: {value: '9'},
          },
        },
      },
    },
  }, {
    initialUrl: 'http://localhost:10200/online-only.html',
    url: 'http://localhost:10200/online-only.html',
    audits: {
      'is-on-https': {
        score: 1,
      },
      'uses-http2': {
        score: 0,
      },
      'external-anchors-use-rel-noopener': {
        score: 1,
      },
      'appcache-manifest': {
        score: 1,
      },
      'geolocation-on-start': {
        score: 1,
      },
      'link-blocking-first-paint': {
        score: 1.00,
      },
      'no-document-write': {
        score: 1,
      },
      'no-mutation-events': {
        score: 1,
      },
      'no-websql': {
        score: 1,
      },
      'script-blocking-first-paint': {
        score: 1.00,
      },
      'uses-passive-event-listeners': {
        score: 1,
      },
      'password-inputs-can-be-pasted-into': {
        score: 1,
      },
    },
  },
];
