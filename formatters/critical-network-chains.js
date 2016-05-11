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
      item.urls.forEach(itemUrl => {
        if (!node[itemUrl]) {
          node[itemUrl] = {};
        }

        node = node[itemUrl];
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
      return Object.keys(node).reduce((output, itemUrl, currentIndex, arr) => {
        // Test if this node has children, and if it's the last child.
        const hasChildren = Object.keys(node[itemUrl]).length > 0;
        const isLastChild = (currentIndex === arr.length - 1);

        // If the parent is the last child then don't drop the vertical bar.
        const padStr = parentIsLastChild ? '  ' : '┃ ';

        // Create the appropriate tree marker based on the depth of this
        // node as well as whether or not it has children and is itself the last child.
        const treeMarker = leftPad('', padStr, depth) +
            (isLastChild ? '┗━' : '┣━') +
            (hasChildren ? '┳' : '━');

        // Return the previous output plus this new node, and recursively write its children.
        return output + `${treeMarker} ${url}\n` + write(node[itemUrl], depth + 1, isLastChild);
      }, '');
    }

    return write(urlTree, 0);
  }

  static getFormatter(type) {
    switch (type) {
      case 'pretty':
        return function(info) {
          const urlTree = CriticalNetworkChains._createURLTreeOutput(info);
          const longestChain = CriticalNetworkChains._getLongestChainLength(info);
          const longestDuration = CriticalNetworkChains._getLongestChainDuration(info);

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

  static getHelpers(results) {
    return {
      createTreeStructure(info, opts) {
        return opts.fn({parent: null, node: CriticalNetworkChains._createURLTree(info)});
      },

      trimURL(resourceURL) {
        const resultsURL = url.parse(results.url);
        const toTrim = resultsURL.protocol + '//' + resultsURL.hostname;
        return resourceURL.replace(toTrim, '');
      },

      childCount(node) {
        return Object.keys(node).length;
      },

      createContextFor(parent, node, opts) {
        return opts.fn({
          parent,
          node
        });
      },

      padDepth(node) {
        let depth = '';
        while (node.parent !== null) {
          depth += '&nbsp;&nbsp;';
          node = node.parent;
        }

        return depth;
      },

      isLastChild(parent, url, opts) {
        const keys = Object.keys(parent.node);
        if (keys.indexOf(url) === keys.length - 1) {
          return opts.fn(this);
        }

        return opts.inverse(this);
      },

      hasChildren(node, opts) {
        if (Object.keys(node).length > 0) {
          return opts.fn(this);
        }

        return opts.inverse(this);
      }
    };
  }
}

module.exports = CriticalNetworkChains;
