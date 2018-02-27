'use strict';

const path = require('path');
const assert = require('assert');
const puppeteer = require('puppeteer');

const lighthouseExtensionPath = path.resolve(__dirname, '../app');
const config = require(path.resolve(__dirname, '../../lighthouse-core/config/default.js'));

puppeteer.launch({
  headless: false,
  executablePath: process.env.CHROME_PATH ? process.env.CHROME_PATH : undefined,
  args: [
    `--disable-extensions-except=${lighthouseExtensionPath}`,
    `--load-extension=${lighthouseExtensionPath}`,
  ],
}).then(browser => {
  browser.newPage()
    .then(page => {
      return page.goto('https://www.paulirish.com', {waitUntil: 'networkidle2'});
    })
    .then(() => browser.targets())
    .then(targets => {
      const extensionTarget = targets.find(target => {
        return target._targetInfo.title === 'Lighthouse';
      });

      if (extensionTarget) {
        extensionTarget.createCDPSession()
          .then(client => {
            client.send('Runtime.enable');

            return client;
          })
          .then(client => {
            return client.send(
              'Runtime.evaluate',
              {
                expression: `runLighthouseInExtension({
                  restoreCleanState: true,
                }, ['performance', 'pwa', 'accessibility', 'best-practices', 'seo'])`,
                awaitPromise: true,
                returnByValue: true,
              }
            );
          })
          .then(() => {
            return browser.pages().then(pages => {
              const page = pages.find(page => page.url().includes('blob:chrome-extension://'));
              const assertAudits = (category, expected, selector) =>
                page.$eval(`#${category}`,
                  (el, {selector}) => el.parentNode.querySelectorAll(selector).length, {selector}
                )
                  .then(audits => {
                    assert.equal(expected, audits);
                  });

              return page.$$('#performance,#pwa,#accessibility,#best-practices,#seo')
                .then(categories => {
                  assert.equal(categories.length, 5);

                  return assertAudits(
                    'performance',
                    config.categories.performance.audits.length,
                    '.lh-audit,.lh-timeline-metric,.lh-perf-hint,.lh-filmstrip'
                  );
                })
                .then(
                  () => assertAudits('pwa', config.categories.pwa.audits.length, '.lh-audit')
                )
                .then(() => assertAudits(
                  'accessibility', config.categories.accessibility.audits.length, '.lh-audit'
                ))
                .then(() => assertAudits(
                  'best-practices',
                  config.categories['best-practices'].audits.length,
                  '.lh-audit'
                ))
                .then(() => assertAudits('seo', config.categories.seo.audits.length, '.lh-audit'));
            })
            .then(() => {
              browser.close();
            })
            .catch((err) => {
              browser.close();
              throw err;
            });
          });
      }
    });
});
