/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const fs = require('fs');

const archiver = require('archiver');
const cpy = require('cpy');
const makeDir = require('make-dir');
const bundleBuilder = require('./build-bundle.js');

const sourceName = 'extension-entry.js';
const distName = 'lighthouse-ext-bundle.js';

const sourceDir = __dirname + '/../clients/extension';
const distDir = __dirname + '/../dist/extension';

const manifestVersion = require(`${sourceDir}/manifest.json`).version;

/**
 * Browserify and minify entry point.
 */
function buildEntryPoint() {
  const inFile = `${sourceDir}/scripts/${sourceName}`;
  const outFile = `${distDir}/scripts/${distName}`;
  return bundleBuilder.build(inFile, outFile);
}

/**
 * Copy popup.js to dist folder, inlining the current commit hash along the way.
 * @return {Promise<void>}
 */
async function copyPopup() {
  let popupSrc = fs.readFileSync(`${sourceDir}/scripts/popup.js`, {encoding: 'utf8'});
  popupSrc = popupSrc.replace(/__COMMITHASH__/g, bundleBuilder.COMMIT_HASH);

  const popupDir = `${distDir}/scripts`;
  await makeDir(popupDir);
  fs.writeFileSync(`${popupDir}/popup.js`, popupSrc);
}

/**
 * @return {Promise<void>}
 */
async function copyAssets() {
  return cpy([
    '*.html',
    'styles/**/*.css',
    'images/**/*',
    'manifest.json',
    '_locales/**', // currently non-functional
  ], distDir, {
    cwd: sourceDir,
    parents: true,
  });
}

/**
 * Put built extension into a zip file ready for install or upload to the
 * webstore.
 * @return {Promise<void>}
 */
async function packageExtension() {
  const packagePath = `${distDir}/../extension-package`;
  await makeDir(packagePath);

  return new Promise((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: {level: 9},
    });

    const outPath = `${packagePath}/lighthouse-${manifestVersion}.zip`;
    const writeStream = fs.createWriteStream(outPath);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);

    archive.pipe(writeStream);
    archive.directory(distDir, false);
    archive.finalize();
  });
}

async function run() {
  const argv = process.argv.slice(2);
  if (argv.includes('package')) {
    return packageExtension();
  }

  await Promise.all([
    buildEntryPoint(),
    copyAssets(),
    copyPopup(),
  ]);
}

run();
