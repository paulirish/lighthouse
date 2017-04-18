/**
 * @license
 * Copyright 2017 Google Inc. All rights reserved.
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

/**
 * @fileoverview Audits a page to see how the size of DOM it creates. Stats like
 * tree depth, # children, and total nodes are returned. The score is calculated
 * based solely on the total number of nodes found on the page.
 */

'use strict';

const Audit = require('../audit');
const Formatter = require('../../report/formatter');
const ONEMB = 1048576;
const HUGE_LAYER = '1MB';


function bytesToSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return String(Math.round(bytes / Math.pow(1024, i), 2)) + sizes[i];
}

function findDepth(arr, id, depth) {
  if(!id) {
    return depth;
  }

  for(let i = 0, l = arr.length; i < l; i++) {
    const layer = arr[i];
    if( layer.layerId === id ) {
      return findDepth(arr, layer.parentLayerId, depth+1);
    }
  }
}


class IncorrectLayers extends Audit {
  /**
   * @return {!AuditMeta}
   */
  static get meta() {
    return {
      category: 'Performance',
      name: 'incorrect-layers',
      description: 'Incorrect Layers',
      informative: true,
      helpText: 'Incorrect layer affects performance. '+
                 'It have to reduce unnecessary overlapped layers.' +
                 `and If the huge layer(over ${HUGE_LAYER}) changes frequently,` +
                 'it is have to separate changing part from unchanging part make layers.' +
                 '[Learn more](https://developers.google.com/web/fundamentals/performance/rendering/stick-to-compositor-only-properties-and-manage-layer-count)',
      requiredArtifacts: ['Layers']
    };
  }
  /**
   * @param {!Artifacts} artifacts
   * @return {!AuditResult}
   */
  static audit(artifacts) {
    const totalCount = artifacts.Layers.length;
    const totalMemory = artifacts.Layers.reduce((a, b) => a + b.memory, 0);
    let invalidCount = 0;

    const results = artifacts.Layers.map(e => {
      const info = {
        overlap: '',
        invalidate: ''
      };

      info.layerId = (new Array(findDepth(artifacts.Layers, e.layerId, 0)-1))
                      .fill('━')
                      .join('') + e.id;

      if(e.compositingReasons.includes('assumedOverlap') ||
         e.compositingReasons.includes('overlap')) {
        invalidCount++;
        info.overlap = '✔';
      }

      if(e.memory > ONEMB && e.paintCount > 0) {
        invalidCount++;
        info.invalidate = `✔ (${bytesToSize(e.memory)}, ${e.paintCount})`;
      }
      return info;
    });

    return {
      displayValue: `Total Layer Count: ${totalCount}, Layer Memory: ${bytesToSize(totalMemory)}`,
      rawValue: invalidCount === 0,
      extendedInfo: {
        formatter: Formatter.SUPPORTED_FORMATS.TABLE,
        value: {
          results,
          tableHeadings: {
            layerId: 'Layer ID',
            overlap: 'Overlaped Layer',
            invalidate: 'Huge(over 1MB) and Repainted(over 1 painted) Layer'
          }
        }
      }
    };
  }
}

module.exports = IncorrectLayers;
