/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/**
  * @fileoverview Gathers all images used on the page with their src, size,
  *   and attribute information. Executes script in the context of the page.
  */
'use strict';

const Gatherer = require('./gatherer');
const pageFunctions = require('../../lib/page-functions.js');
const Driver = require('../driver.js'); // eslint-disable-line no-unused-vars

/* global window, getElementsInDocument, Image */

/** @return {Array<LH.Artifacts.ImageElement>} */
/* istanbul ignore next */
function collectImageElementInfo() {
  /** @param {Element} element */
  function getClientRect(element) {
    const clientRect = element.getBoundingClientRect();
    return {
      // manually copy the properties because ClientRect does not JSONify
      top: clientRect.top,
      bottom: clientRect.bottom,
      left: clientRect.left,
      right: clientRect.right,
    };
  }

  /** @type {Array<Element>} */
  // @ts-ignore - added by getElementsInDocumentFnString
  const allElements = getElementsInDocument();
  const allImageElements = /** @type {Array<HTMLImageElement>} */ (allElements.filter(element => {
    return element.localName === 'img';
  }));

  /** @type {Array<LH.Artifacts.ImageElement>} */
  const htmlImages = allImageElements.map(element => {
    const computedStyle = window.getComputedStyle(element);
    return {
      // currentSrc used over src to get the url as determined by the browser
      // after taking into account srcset/media/sizes/etc.
      src: element.currentSrc,
      displayedWidth: element.width,
      displayedHeight: element.height,
      clientRect: getClientRect(element),
      naturalWidth: element.naturalWidth,
      naturalHeight: element.naturalHeight,
      isCss: false,
      resourceSize: 0, // this will get overwritten below
      isPicture: !!element.parentElement && element.parentElement.tagName === 'PICTURE',
      usesObjectFit: ['cover', 'contain', 'scale-down', 'none'].includes(
        computedStyle.getPropertyValue('object-fit')
      ),
    };
  });

  // Chrome normalizes background image style from getComputedStyle to be an absolute URL in quotes.
  // Only match basic background-image: url("http://host/image.jpeg") declarations
  const CSS_URL_REGEX = /^url\("([^"]+)"\)$/;
  // Only find images that aren't specifically scaled
  const CSS_SIZE_REGEX = /(auto|contain|cover)/;

  const cssImages = allElements.reduce((images, element) => {
    const style = window.getComputedStyle(element);
    if (!style.backgroundImage || !CSS_URL_REGEX.test(style.backgroundImage) ||
        !style.backgroundSize || !CSS_SIZE_REGEX.test(style.backgroundSize)) {
      return images;
    }

    const imageMatch = style.backgroundImage.match(CSS_URL_REGEX);
    // @ts-ignore test() above ensures that there is a match.
    const url = imageMatch[1];

    // Heuristic to filter out sprite sheets
    const differentImages = images.filter(image => image.src !== url);
    if (images.length - differentImages.length > 2) {
      return differentImages;
    }

    images.push({
      src: url,
      displayedWidth: element.clientWidth,
      displayedHeight: element.clientHeight,
      clientRect: getClientRect(element),
      // CSS Images do not expose natural size, we'll determine the size later
      naturalWidth: Number.MAX_VALUE,
      naturalHeight: Number.MAX_VALUE,
      isCss: true,
      isPicture: false,
      usesObjectFit: false,
      resourceSize: 0, // this will get overwritten below
    });

    return images;
  }, /** @type {Array<LH.Artifacts.ImageElement>} */ ([]));

  return htmlImages.concat(cssImages);
}

/**
 * @param {string} url
 * @return {Promise<{naturalWidth: number, naturalHeight: number}>}
 */
/* istanbul ignore next */
function determineNaturalSize(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('error', _ => reject(new Error('determineNaturalSize failed img load')));
    img.addEventListener('load', () => {
      resolve({
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    });

    img.src = url;
  });
}

class ImageElements extends Gatherer {
  /**
   * @param {Driver} driver
   * @param {LH.Artifacts.ImageElement} element
   * @return {Promise<LH.Artifacts.ImageElement>}
   */
  async fetchElementWithSizeInformation(driver, element) {
    const url = JSON.stringify(element.src);
    try {
      /** @type {{naturalWidth: number, naturalHeight: number}} */
      const size = await driver.evaluateAsync(`(${determineNaturalSize.toString()})(${url})`);
      return Object.assign(element, size);
    } catch (_) {
      // determineNaturalSize fails on invalid images, which we treat as non-visible
      return Object.assign(element, {naturalWidth: 0, naturalHeight: 0});
    }
  }

  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @param {LH.Gatherer.LoadData} loadData
   * @return {Promise<LH.Artifacts['ImageElements']>}
   */
  async afterPass(passContext, loadData) {
    const driver = passContext.driver;
    const indexedNetworkRecords = loadData.networkRecords.reduce((map, record) => {
      if (/^image/.test(record.mimeType) && record.finished) {
        map[record.url] = record;
      }

      return map;
    }, /** @type {Object<string, LH.Artifacts.NetworkRequest>} */ ({}));

    const expression = `(function() {
      ${pageFunctions.getElementsInDocumentString}; // define function on page
      return (${collectImageElementInfo.toString()})();
    })()`;

    /** @type {Array<LH.Artifacts.ImageElement>} */
    const elements = await driver.evaluateAsync(expression);

    const imageUsage = [];
    for (let element of elements) {
      // Pull some of our information directly off the network record.
      const networkRecord = indexedNetworkRecords[element.src] || {};
      element.mimeType = networkRecord.mimeType;
      // Resource size is almost always the right one to be using because of the below:
      //     transferSize = resourceSize + headers.length
      // HOWEVER, there are some cases where an image is compressed again over the network and transfer size
      // is smaller (see https://github.com/GoogleChrome/lighthouse/pull/4968).
      // Use the min of the two numbers to be safe.
      const {resourceSize = 0, transferSize = 0} = networkRecord;
      element.resourceSize = Math.min(resourceSize, transferSize);

      // Images within `picture` behave strangely and natural size information isn't accurate,
      // CSS images have no natural size information at all. Try to get the actual size if we can.
      // Additional fetch is expensive; don't bother if we don't have a networkRecord for the image.
      if ((element.isPicture || element.isCss) && networkRecord) {
        element = await this.fetchElementWithSizeInformation(driver, element);
      }

      imageUsage.push(element);
    }

    return imageUsage;
  }
}

module.exports = ImageElements;
