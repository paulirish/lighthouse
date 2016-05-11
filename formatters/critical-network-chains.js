/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const url = require('url');
const path = require('path');
const fs = require('fs');
const Formatter = require('./formatter');
const html = fs.readFileSync(path.join(__dirname, 'partials/critical-network-chains.html'), 'utf8');

class CriticalNetworkChains extends Formatter {
  static _getLongestChainLength(info) {
    return info.reduce((total, item) => {
      if (item.totalRequests > total) {
        return item.totalRequests;
      }

      return total;
    }, 0);
  }

  static _getLongestChainDuration(info) {
    return info.reduce((total, item) => {
      if (item.totalTimeBetweenBeginAndEnd > total) {
        return item.totalTimeBetweenBeginAndEnd;
      }

      return total;
    }, 0);
  }

  static _createURLTree(info) {
    return info.reduce((tree, item) => {
      let node = tree;
      item.urls.forEach((itemURL, index, arr) => {
        if (!node[itemURL]) {
          const isLastChild = (index === arr.length - 1);
          node[itemURL] = isLastChild ? item.totalTimeBetweenBeginAndEnd : {};
        }

        node = node[itemURL];
      });

      return tree;
    }, {});
  }

  static _createURLTreeOutput(info) {
    const urlTree = CriticalNetworkChains._createURLTree(info);

    function leftPad(str, padStr, amount) {
      while (amount--) {
        str = padStr + str;
      }
      return str;
    }

    function write(node, depth, parentIsLastChild) {
      return Object.keys(node).reduce((output, itemURL, currentIndex, arr) => {
        // Test if this node has children, and if it's the last child.
        const hasChildren = (typeof node[itemURL] === 'object') &&
            Object.keys(node[itemURL]).length > 0;
        const isLastChild = (currentIndex === arr.length - 1);

        // If the parent is the last child then don't drop the vertical bar.
        const padStr = parentIsLastChild ? '  ' : '┃ ';

        // Create the appropriate tree marker based on the depth of this
        // node as well as whether or not it has children and is itself the last child.
        const treeMarker = leftPad('', padStr, depth) +
            (isLastChild ? '┗━' : '┣━') +
            (hasChildren ? '┳' : '━');

        // Return the previous output plus this new node, and recursively write its children.
        return output + `${treeMarker} ${CriticalNetworkChains.formatURL(itemURL)}` +
            // If this node has children, write them out. Othewise write the chain time.
            (hasChildren ? '' : ` (${node[itemURL].toFixed(2)}ms)`) + '\n' +
            write(node[itemURL], depth + 1, isLastChild);
      }, '');
    }

    return write(urlTree, 0);
  }

  static getFormatter(type) {
    switch (type) {
      case 'pretty':
        return function(info) {
          const longestChain = CriticalNetworkChains._getLongestChainLength(info);
          const longestDuration = CriticalNetworkChains._getLongestChainDuration(info);
          const urlTree = CriticalNetworkChains._createURLTreeOutput(info);

          const output = `    - Critical network chains: ${info.length}\n` +
          `    - Longest request chain (shorter is better): ${longestChain}\n` +
          `    - Longest chain duration (shorter is better): ${longestDuration.toFixed(2)}ms\n` +
          '    - Chains\n' +
              '      ' + urlTree.replace(/\n/g, '\n      ') + '\n';
          return output;
        };

      case 'html':
        // Returns a handlebars string to be used by the Report.
        return html;

      default:
        throw new Error('Unknown formatter type');
    }
  }

  static formatTime(time) {
    return time.toFixed(2);
  }

  static formatURL(resourceURL) {
    const parsedResourceURL = url.parse(resourceURL);
    const file = parsedResourceURL.path
        // Grab the last two parts of the path.
        .split('/').slice(-2).join('/')
        // Remove any query strings.
        .replace(/\?.*/, '');

    return file;
  }

  static getHelpers() {
    return {
      createTreeStructure(info, opts) {
        return opts.fn({parent: null, node: CriticalNetworkChains._createURLTree(info)});
      },

      chains(info) {
        return info.length;
      },

      longestChain(info) {
        return CriticalNetworkChains._getLongestChainLength(info);
      },

      longestDuration(info) {
        return CriticalNetworkChains._getLongestChainDuration(info);
      },

      formatURL: CriticalNetworkChains.formatURL,

      formatTime: CriticalNetworkChains.formatTime,

      childCount(node) {
        return Object.keys(node).length;
      },

      createContextFor(parent, node, url, parentIsLastChild, opts) {
        const siblings = Object.keys(parent.node);
        const isLastChild = siblings.indexOf(url) === (siblings.length - 1);
        const hasChildren = Object.keys(node).length > 0;

        let depth = [];
        let ancestor = parent.parent;
        while (ancestor !== null) {
          depth.push(!parentIsLastChild);
          ancestor = ancestor.parent;
        }

        return opts.fn({
          parent,
          node,
          isLastChild,
          hasChildren,
          parentIsLastChild,
          depth
        });
      }
    };
  }
}

module.exports = CriticalNetworkChains;
