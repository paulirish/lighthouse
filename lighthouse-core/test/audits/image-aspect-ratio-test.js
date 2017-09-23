/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('../../audits/image-aspect-ratio.js');
const assert = require('assert');

/* eslint-env mocha */
function generateRecord(url = 'https://google.com/logo.png', mimeType = 'image/png') {
  return {
    url,
    mimeType,
  };
}

function generateImage(clientSize, naturalSize, networkRecord, props, src = 'https://google.com/logo.png') {
  Object.assign(networkRecord || {}, {url: src});
  const image = {src, networkRecord};
  Object.assign(image, clientSize, naturalSize, props);
  return image;
}

describe('Images: aspect-ratio audit', () => {
  function testImage(condition, data) {
    const description = `identifies when an image ${condition}`;
    it(description, () => {
      const result = Audit.audit({
        ImageUsage: [
          generateImage(
              {width: data.clientSize[0], height: data.clientSize[1]},
              {naturalWidth: data.naturalSize[0], naturalHeight: data.naturalSize[1]},
              generateRecord(),
              data.props
          ),
        ],
      });

      assert.equal(result.rawValue, data.listed ? 1 : 0);
    });
  }

  testImage('is much larger than natural aspect ratio', {
    listed: true,
    clientSize: [800, 500],
    naturalSize: [200, 200],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });

  testImage('is a css image and much larger than natural aspect ratio', {
    listed: false,
    clientSize: [],
    naturalSize: [200, 200],
    props: {
      isCss: true,
      usesObjectFit: false,
    },
  });

  testImage('is larger than natural aspect ratio', {
    listed: true,
    clientSize: [400, 300],
    naturalSize: [200, 200],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });

  testImage('uses object-fit and is much smaller than natural aspect ratio', {
    listed: false,
    clientSize: [200, 200],
    naturalSize: [800, 500],
    props: {
      isCss: false,
      usesObjectFit: true,
    },
  });

  testImage('is much smaller than natural aspect ratio', {
    listed: true,
    clientSize: [200, 200],
    naturalSize: [800, 500],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });

  testImage('is smaller than natural aspect ratio', {
    listed: true,
    clientSize: [200, 200],
    naturalSize: [400, 300],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });

  testImage('aspect ratios match', {
    listed: false,
    clientSize: [100, 100],
    naturalSize: [300, 300],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });

  testImage('has invalid sizing information', {
    listed: false,
    clientSize: [0, 0],
    naturalSize: [100, 100],
    props: {
      isCss: false,
      usesObjectFit: false,
    },
  });
});
