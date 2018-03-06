/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const puppeteer = require('puppeteer');

const lighthouseExtensionPath = path.resolve(__dirname, '../app');
const config = require(path.resolve(__dirname, '../../lighthouse-core/config/default.js'));
const lighthouseCategories = Object.keys(config.categories);

const manifestLocation = path.join(lighthouseExtensionPath, 'manifest.json');
// read original manifest
const originalManifest = fs.readFileSync(manifestLocation);
const manifest = JSON.parse(originalManifest);
// add tabs permision to the manifest
manifest.permissions.push('tabs');
// write new file to document
fs.writeFileSync(manifestLocation, JSON.stringify(manifest));

let extensionPage;

const assertAuditElements = async ({category, expected, selector}) => {
  const elementCount = await extensionPage.evaluate(({category, selector}) =>
    document.querySelector(`#${category}`).parentNode.querySelectorAll(selector).length,
    {category, selector}
  );

  assert.equal(expected, elementCount);
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: process.env.CHROME_PATH,
    args: [
      `--disable-extensions-except=${lighthouseExtensionPath}`,
      `--load-extension=${lighthouseExtensionPath}`,
    ],
  });

  const page = await browser.newPage();
  await page.goto('https://www.paulirish.com', {waitUntil: 'networkidle2'});
  const targets = await browser.targets();
  const extensionTarget = targets.find(({_targetInfo}) => {
    return _targetInfo.title === 'Lighthouse' &&
      _targetInfo.type === 'background_page';
  });

  if (extensionTarget) {
    try {
      const client = await extensionTarget.createCDPSession();
      const lighthouseResult = await client.send(
        'Runtime.evaluate',
        {
          expression: `runLighthouseInExtension({
            restoreCleanState: true,
          }, ${JSON.stringify(lighthouseCategories)})`,
          awaitPromise: true,
          returnByValue: true,
        }
      );

      if (lighthouseResult.exceptionDetails) {
        if (lighthouseResult.exceptionDetails.exception) {
          throw new Error(lighthouseResult.exceptionDetails.exception.description);
        }

        throw new Error(lighthouseResult.exceptionDetails.text);
      }

      extensionPage = (await browser.pages())
        .find(page => page.url().includes('blob:chrome-extension://'));

      const categories = await extensionPage.$$(`#${lighthouseCategories.join(',#')}`);
      assert.equal(categories.length, lighthouseCategories.length);

      await lighthouseCategories.forEach(async (category) => {
        let selector = '.lh-audit';
        if (category === 'performance') {
          selector = '.lh-audit,.lh-timeline-metric,.lh-perf-hint,.lh-filmstrip';
        }

        await assertAuditElements({
          category,
          expected: config.categories[category].audits.length,
          selector,
        });
      });
    } catch (err) {
      assert.ok(false, err.message);
    }
  }

  await browser.close();

  // put the default manifest back
  fs.writeFileSync(manifestLocation, originalManifest);
})();
