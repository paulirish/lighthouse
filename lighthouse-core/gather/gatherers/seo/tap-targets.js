/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* global getComputedStyle, getElementsInDocument, Node, getNodePath, getNodeSelector */

const Gatherer = require('../gatherer');
const pageFunctions = require('../../../lib/page-functions.js');
const {rectContainsString, rectContains} = require('../../../lib/rect-helpers');

const TARGET_SELECTORS = [
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'option',
  '[role=button]',
  '[role=checkbox]',
  '[role=link]',
  '[role=menuitem]',
  '[role=menuitemcheckbox]',
  '[role=menuitemradio]',
  '[role=option]',
  '[role=scrollbar]',
  '[role=slider]',
  '[role=spinbutton]',
];
const tapTargetsSelector = TARGET_SELECTORS.join(',');

/**
 * @param {Element} element
 * @returns {boolean}
 */
/* istanbul ignore next */
function elementIsVisible(element) {
  const {overflowX, overflowY, display, visibility} = getComputedStyle(element);

  if (
    display === 'none' ||
    (visibility === 'collapse' && ['TR', 'TBODY', 'COL', 'COLGROUP'].includes(element.tagName))
  ) {
    // Element not displayed
    return false;
  }

  // only for block and inline-block, since clientWidth/Height are always 0 for inline elements
  if (display === 'block' || display === 'inline-block') {
    // if height/width is 0 and no overflow in that direction then
    // there's no content that the user can see and tap on
    if ((element.clientWidth === 0 && overflowX === 'hidden') ||
        (element.clientHeight === 0 && overflowY === 'hidden')) {
      return false;
    }
  }

  const parent = element.parentElement;
  if (parent && parent.tagName !== 'BODY') {
    // if a parent is invisible then the current element is also invisible
    return elementIsVisible(parent);
  }

  return true;
}

/**
 * @param {LH.Artifacts.Rect[]} clientRects
 */
/* istanbul ignore next */
function allClientRectsEmpty(clientRects) {
  return clientRects.every(cr => cr.width === 0 && cr.height === 0);
}

/**
 * @param {Element} element
 */
/* istanbul ignore next */
function getVisibleClientRects(element) {
  if (!elementIsVisible(element)) {
    return [];
  }

  let clientRects = getClientRects(element);

  if (allClientRectsEmpty(clientRects)) {
    return [];
  }

  // Treating overflowing content in scroll containers as invisible could mean that
  // most of a given page is deemed invisible. But:
  // - tap targets audit doesn't consider different containers/layers
  // - having most content in an explicit scroll container is rare
  // - treating them as hidden only generates false passes, which is better than false failures
  clientRects = filterClientRectsWithinAncestorsVisibleScrollArea(element, clientRects);

  return clientRects;
}

/**
 *
 * @param {Element} element
 * @param {LH.Artifacts.Rect[]} clientRects
 * @returns {LH.Artifacts.Rect[]}
 */
/* istanbul ignore next */
function filterClientRectsWithinAncestorsVisibleScrollArea(element, clientRects) {
  const parent = element.parentElement;
  if (!parent) {
    return clientRects;
  }
  if (getComputedStyle(parent).overflowY !== 'visible') {
    const parentBCR = parent.getBoundingClientRect();
    clientRects = clientRects.filter(cr => rectContains(parentBCR, cr));
  }
  if (parent.parentElement && parent.parentElement.tagName !== 'BODY') {
    return filterClientRectsWithinAncestorsVisibleScrollArea(
      parent,
      clientRects
    );
  }
  return clientRects;
}

/**
 * @param {Element} element
 * @returns {LH.Artifacts.Rect[]}
 */
/* istanbul ignore next */
function getClientRects(element) {
  const clientRects = Array.from(
    element.getClientRects()
  ).map(clientRect => {
    // Contents of DOMRect get lost when returned from Runtime.evaluate call,
    // so we convert them to plain objects.
    const {width, height, left, top, right, bottom} = clientRect;
    return {width, height, left, top, right, bottom};
  });

  for (const child of element.children) {
    clientRects.push(...getClientRects(child));
  }

  return clientRects;
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
/* istanbul ignore next */
function elementHasAncestorTapTarget(element) {
  if (!element.parentElement) {
    return false;
  }
  if (element.parentElement.matches(tapTargetsSelector)) {
    return true;
  }
  return elementHasAncestorTapTarget(element.parentElement);
}

/**
 * @param {Element} element
 */
/* istanbul ignore next */
function hasTextNodeSiblingsFormingTextBlock(element) {
  if (!element.parentElement) {
    return false;
  }

  const parentElement = element.parentElement;

  const nodeText = element.textContent || '';
  const parentText = parentElement.textContent || '';
  if (parentText.length - nodeText.length < 5) {
    // Parent text mostly consists of this node, so the parent
    // is not a text block container
    return false;
  }

  for (const sibling of element.parentElement.childNodes) {
    if (sibling === element) {
      continue;
    }
    const siblingTextContent = (sibling.textContent || '').trim();
    // Only count text in text nodes so that a series of e.g. buttons isn't counted
    // as a text block.
    // This works reasonably well, but means we miss text blocks where all text is e.g.
    // wrapped in spans
    if (sibling.nodeType === Node.TEXT_NODE && siblingTextContent.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check if element is in a block of text, such as paragraph with a bunch of links in it.
 * Makes a reasonable guess, but for example gets it wrong if the element is surrounded by other
 * HTML elements instead of direct text nodes.
 * @param {Element} element
 * @returns {boolean}
 */
/* istanbul ignore next */
function elementIsInTextBlock(element) {
  const {display} = getComputedStyle(element);
  if (display !== 'inline' && display !== 'inline-block') {
    return false;
  }

  if (hasTextNodeSiblingsFormingTextBlock(element)) {
    return true;
  } else if (element.parentElement) {
    return elementIsInTextBlock(element.parentElement);
  } else {
    return false;
  }
}

/**
 * @param {Element} element
 * @returns {boolean}
 */
/* istanbul ignore next */
function elementIsPositionFixedOrAbsolute(element) {
  const {position} = getComputedStyle(element);
  if (position === 'fixed' || position === 'absolute') {
    return true;
  }
  if (element.parentElement) {
    return elementIsPositionFixedOrAbsolute(element.parentElement);
  }
  return false;
}

/**
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
/* istanbul ignore next */
function truncate(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * @returns {LH.Artifacts.TapTarget[]}
 */
/* istanbul ignore next */
function gatherTapTargets() {
  /** @type {LH.Artifacts.TapTarget[]} */
  const targets = [];

  /** @type {Element[]} */
  // @ts-ignore - getElementsInDocument put into scope via stringification
  const tapTargetElements = getElementsInDocument(tapTargetsSelector);

  tapTargetElements.forEach(tapTargetElement => {
    // Filter out tap targets that are likely to cause false failures:
    if (elementHasAncestorTapTarget(tapTargetElement)) {
      // This is usually intentional, either the tap targets trigger the same action
      // or there's a child with a related action (like a delete button for an item)
      return;
    }
    if (elementIsInTextBlock(tapTargetElement)) {
      // Links inside text blocks cause a lot of failures, and there's also an exception for them
      // in the Web Content Accessibility Guidelines https://www.w3.org/TR/WCAG21/#target-size
      return;
    }
    if (elementIsPositionFixedOrAbsolute(tapTargetElement)) {
      // Absolutely positioned elements might not be visible if they have a lower z-index
      // than other tap targets, but if we don't ignore them we can get false failures.
      //
      // TODO: rewrite logic to use elementFromPoint to check if an element is visible
      // (this should also mean we'd no longer need to check ancestor visible scroll area)
      return;
    }

    const visibleClientRects = getVisibleClientRects(tapTargetElement);
    if (visibleClientRects.length === 0) {
      return;
    }

    targets.push({
      clientRects: visibleClientRects,
      snippet: truncate(tapTargetElement.outerHTML, 300),
      // @ts-ignore - getNodePath put into scope via stringification
      path: getNodePath(tapTargetElement),
      // @ts-ignore - getNodeSelector put into scope via stringification
      selector: getNodeSelector(tapTargetElement),
      href: /** @type {HTMLAnchorElement} */(tapTargetElement)['href'] || '',
    });
  });

  return targets;
}

class TapTargets extends Gatherer {
  /**
   * @param {LH.Gatherer.PassContext} passContext
   * @return {Promise<LH.Artifacts.TapTarget[]>} All visible tap targets with their positions and sizes
   */
  afterPass(passContext) {
    const expression = `(function() {
      const tapTargetsSelector = "${tapTargetsSelector}";
      ${pageFunctions.getElementsInDocumentString};
      ${filterClientRectsWithinAncestorsVisibleScrollArea.toString()};
      ${elementIsPositionFixedOrAbsolute.toString()};
      ${elementIsVisible.toString()};
      ${elementHasAncestorTapTarget.toString()};
      ${getVisibleClientRects.toString()};
      ${truncate.toString()};
      ${getClientRects.toString()};
      ${hasTextNodeSiblingsFormingTextBlock.toString()};
      ${elementIsInTextBlock.toString()};
      ${allClientRectsEmpty.toString()};
      ${rectContainsString};
      ${pageFunctions.getNodePathString};
      ${pageFunctions.getNodeSelectorString};
      ${gatherTapTargets.toString()};

      return gatherTapTargets();
    })()`;

    return passContext.driver.evaluateAsync(expression, {useIsolation: true});
  }
}

module.exports = TapTargets;
