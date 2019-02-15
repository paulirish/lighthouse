/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
/**
 * @fileoverview Checks to see if the aspect ratio of the images used on
 *   the page are equal to the aspect ratio of their display sizes. The
 *   audit will list all images that don't match with their display size
 *   aspect ratio.
 */
'use strict';

const Audit = require('./audit');

const URL = require('../lib/url-shim');
const THRESHOLD_PX = 2;

/** @typedef {Required<LH.Artifacts.ImageElement>} WellDefinedImage */

class ImageAspectRatio extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'image-aspect-ratio',
      title: 'Displays images with correct aspect ratio',
      failureTitle: 'Displays images with incorrect aspect ratio',
      description: 'Image display dimensions should match natural aspect ratio. ' +
        '[Learn more](https://developers.google.com/web/tools/lighthouse/audits/aspect-ratio).',
      requiredArtifacts: ['ImageElements'],
    };
  }

  /**
   * @param {WellDefinedImage} image
   * @return {Error|{url: string, displayedAspectRatio: string, actualAspectRatio: string, doRatiosMatch: boolean}}
   */
  static computeAspectRatios(image) {
    const url = URL.elideDataURI(image.src);
    const actualAspectRatio = image.naturalWidth / image.naturalHeight;
    const displayedAspectRatio = image.displayedWidth / image.displayedHeight;

    const targetDisplayHeight = image.displayedWidth / actualAspectRatio;
    const doRatiosMatch = Math.abs(targetDisplayHeight - image.displayedHeight) < THRESHOLD_PX;

    if (!Number.isFinite(actualAspectRatio) ||
      !Number.isFinite(displayedAspectRatio)) {
      return new Error(`Invalid image sizing information ${url}`);
    }

    return {
      url,
      displayedAspectRatio: `${image.displayedWidth} x ${image.displayedHeight}
        (${displayedAspectRatio.toFixed(2)})`,
      actualAspectRatio: `${image.naturalWidth} x ${image.naturalHeight}
        (${actualAspectRatio.toFixed(2)})`,
      doRatiosMatch,
    };
  }

  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const images = artifacts.ImageElements;

    /** @type {string[]} */
    const warnings = [];
    /** @type {Array<{url: string, displayedAspectRatio: string, actualAspectRatio: string, doRatiosMatch: boolean}>} */
    const results = [];
    images.filter(image => {
      // - filter out images that don't have following properties:
      //   networkRecord, width, height, images that use `object-fit`: `cover` or `contain`
      // - filter all svgs as they have no natural dimensions to audit
      return image.mimeType &&
        image.mimeType !== 'image/svg+xml' &&
        image.naturalHeight > 5 &&
        image.naturalWidth > 5 &&
        image.displayedWidth &&
        image.displayedHeight &&
        !image.usesObjectFit;
    }).forEach(image => {
      const wellDefinedImage = /** @type {WellDefinedImage} */ (image);
      const processed = ImageAspectRatio.computeAspectRatios(wellDefinedImage);
      if (processed instanceof Error) {
        warnings.push(processed.message);
        return;
      }

      if (!processed.doRatiosMatch) results.push(processed);
    });

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'url', itemType: 'thumbnail', text: ''},
      {key: 'url', itemType: 'url', text: 'URL'},
      {key: 'displayedAspectRatio', itemType: 'text', text: 'Aspect Ratio (Displayed)'},
      {key: 'actualAspectRatio', itemType: 'text', text: 'Aspect Ratio (Actual)'},
    ];

    return {
      rawValue: results.length === 0,
      warnings,
      details: Audit.makeTableDetails(headings, results),
    };
  }
}

module.exports = ImageAspectRatio;
