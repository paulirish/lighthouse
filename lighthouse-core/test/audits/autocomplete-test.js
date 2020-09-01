/**
 * @license Copyright 2016 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const Autocomplete = require('../../audits/autocomplete.js');


describe('Best Practices: autocomplete audit', () => {
  it('fails when an there is no autocomplete attribute set', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'name_cc',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: null,
                prediction: 'HTML_TYPE_CREDIT_CARD_NAME_FULL',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="name_cc">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: null,
                prediction: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo">',
            },
          ],
          labels: [],
        },
      ],
    };
    const expectedItems = [
      {
        'current': '',
        'node': {
          'nodeLabel': 'input',
          'snippet': '<input type="text" name="name_cc">',
          'type': 'node',
        },
        'suggestion': 'cc-name',
      },
      {
        'current': '',
        'node': {
          'nodeLabel': 'input',
          'snippet': '<input type="text" name="CCNo">',
          'type': 'node',
        },
        'suggestion': 'cc-number',
      },
    ];
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details.items).toStrictEqual(expectedItems);
  });
  it('fails when an there is an invalid autocomplete attribute set', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'name_cc',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: 'namez',
                prediction: 'UNKNOWN_TYPE',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="name_cc" autocomplete="namez">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: 'ccc-num',
                prediction: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo" autocomplete="ccc-num">',
            },
          ],
          labels: [],
        },
      ],
    };
    const expectedItems = [
      {
        current: 'namez',
        node: {
          nodeLabel: 'input',
          snippet: '<input type="text" name="name_cc" autocomplete="namez">',
          type: 'node',
        },
        suggestion: 'Requires manual review.',
      },
      {
        current: 'ccc-num',
        node: {
          nodeLabel: 'input',
          snippet: '<input type="text" name="CCNo" autocomplete="ccc-num">',
          type: 'node',
        },
        suggestion: 'cc-number',
      },
    ];
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details.items).toStrictEqual(expectedItems);
  });
  it('passes when an there is a valid autocomplete attribute set', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'name_cc',
              placeholder: '',
              autocomplete: {
                property: 'section-red shipping cc-name',
                attribute: 'section-red shipping cc-name',
                prediction: 'UNKNOWN_TYPE',
              },
              nodeLabel: 'textarea',
              // eslint-disable-next-line max-len
              snippet: '<textarea type="text" name="name_cc" autocomplete="section-red shipping cc-name">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocomplete: {
                property: 'cc-number',
                attribute: 'cc-number',
                prediction: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo" autocomplete="cc-number">',
            },
            {
              id: '',
              name: 'mobile-number',
              placeholder: '',
              autocomplete: {
                property: 'section-red shipping mobile tel',
                attribute: 'section-red shipping mobile tel',
                prediction: 'HTML_TYPE_TEL',
              },
              nodeLabel: 'input',
              // eslint-disable-next-line max-len
              snippet: '<input name="mobile-number" autocomplete="section-red shipping mobile tel">',
            },
          ],
          labels: [],
        },
      ],
    };
    const {score} = Autocomplete.audit(artifacts);
    expect(score).toBe(1);
  });
  it('not applicable when an there is no autofill prediction and no attribute set', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'edge_case',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: null,
                prediction: 'UNKNOWN_TYPE',
              },
              nodeLabel: 'textarea',
              snippet: '<textarea type="text" name="edge_case">',
            },
            {
              id: '',
              name: 'random',
              placeholder: '',
              autocomplete: {
                property: '',
                attribute: null,
                prediction: 'UNKNOWN_TYPE',
              },
              nodeLabel: 'input',
              snippet: '<input type="text" name="random">',
            },
          ],
          labels: [],
        },
      ],
    };
    const {notApplicable} = Autocomplete.audit(artifacts);
    expect(notApplicable).toBe(true);
  });
  it('fails when autocomplete is valid but prefix is invalid', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'name_cc2',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'sectio-red cc-name',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NAME_FULL',
              nodeLabel: 'textarea',
              snippet: '<textarea type="text" name="name_cc2" autocomplete="sectio-red cc-name">',
            },
            {
              id: '',
              name: 'CCNo2',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'shippin name',
              autofillPredict: 'NAME_FULL',
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo2" autocomplete="shippin name">',
            },
          ],
          labels: [],
        },
      ],
    };
    
    const {score} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
  });
  it('fails when autocomplete prefix is valid but out of order', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'name_cc2',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'shipping section-red cc-name',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NAME_FULL',
              nodeLabel: 'textarea',
              // eslint-disable-next-line max-len
              snippet: '<textarea type="text" name="name_cc2" autocomplete="shipping section-red cc-name">',
            },
            {
              id: '',
              name: 'CCNo2',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'shipping section-red  mobile tel',
              autofillPredict: 'HTML_TYPE_TEL',
              nodeLabel: 'input',
              // eslint-disable-next-line max-len
              snippet: '<input type="text" name="CCNo2" autocomplete="shipping section-red  mobile tel">',
            },
          ],
          labels: [],
        },
      ],
    };
    const expectedDetails = {
      headings: [
        {
          itemType: 'node',
          key: 'node',
          text: 'lighthouse-core/lib/i18n/i18n.js | columnFailingElem # 0',
        },
        {
          itemType: 'text',
          key: 'suggestion',
          text: 'lighthouse-core/audits/autocomplete.js | columnAutocompleteSuggestions # 0',
        },
        {
          itemType: 'text',
          key: 'prefix',
          text: 'lighthouse-core/audits/autocomplete.js | columnAutocompletePrefixSuggestion # 0',
        },
      ],
      items: [
        {
          node: {
            nodeLabel: 'textarea',
            // eslint-disable-next-line max-len
            snippet: '<textarea type="text" name="name_cc2" autocomplete="shipping section-red cc-name">',
            type: 'node',
          },
          prefix: 'Review order of Autocomplete Tokens',
          suggestion: 'cc-name',
        },
        {
          node: {
            nodeLabel: 'input',
            // eslint-disable-next-line max-len
            snippet: '<input type="text" name="CCNo2" autocomplete="shipping section-red  mobile tel">',
            type: 'node',
          },
          prefix: 'Review: ',
          suggestion: 'tel',
        },
      ],
      summary: undefined,
      type: 'table',
    };
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details).toStrictEqual(expectedDetails);
  });
});

describe('Autocomplete Audit: Check Attribute Validity', () => {
  it('returns false if the attribute is empty', () => {
    /** @type {LH.Artifacts.FormInput} */
    const input = {
      id: '',
      name: '',
      placeholder: '',
      autocomplete: {
        property: '',
        attribute: '',
        prediction: '',
      },
      nodeLabel: '',
      snippet: '',
    };
    const output = Autocomplete.checkAttributeValidity(input);
    const expectedOutput = {hasValidTokens: false};
    expect(output).toStrictEqual(expectedOutput);
  });

  it('returns true if attribute has optional "section=" token', () => {
    /** @type {LH.Artifacts.FormInput} */
    const input = {
      id: '',
      name: '',
      placeholder: '',
      autocomplete: {
        property: 'section-foo name',
        attribute: 'section-foo name',
        prediction: '',
      },
      nodeLabel: '',
      snippet: '',
    };
    const output = Autocomplete.checkAttributeValidity(input);
    const expectedOutput = {hasValidTokens: true, isValidOrder: true};
    expect(output).toStrictEqual(expectedOutput);
  });

  it('returns true if all tokens are valid and in order', () => {
    /** @type {LH.Artifacts.FormInput} */
    const input = {
      id: '',
      name: '',
      placeholder: '',
      autocomplete: {
        property: 'shipping mobile tel',
        attribute: 'shipping mobile tel',
        prediction: '',
      },
      nodeLabel: '',
      snippet: '',
    };
    const output = Autocomplete.checkAttributeValidity(input);
    const expectedOutput = {hasValidTokens: true, isValidOrder: true};
    expect(output).toStrictEqual(expectedOutput);
  });

  it(`returns true for hasValidTokens and false for isValidOrder
      when tokens are valid but out of order`, () => {
    /** @type {LH.Artifacts.FormInput} */
    const input = {
      id: '',
      name: '',
      placeholder: '',
      autocomplete: {
        property: '',
        attribute: 'mobile shipping tel',
        prediction: '',
      },
      nodeLabel: '',
      snippet: '',
    };
    const output = Autocomplete.checkAttributeValidity(input);
    const expectedOutput = {hasValidTokens: true, isValidOrder: false};
    expect(output).toStrictEqual(expectedOutput);
  });

  it('returns false for invalid tokens', () => {
    /** @type {LH.Artifacts.FormInput} */
    const input = {
      id: '',
      name: '',
      placeholder: '',
      autocomplete: {
        property: '',
        attribute: 'invalid-token',
        prediction: '',
      },
      nodeLabel: '',
      snippet: '',
    };
    const output = Autocomplete.checkAttributeValidity(input);
    const expectedOutput = {hasValidTokens: false};
    expect(output).toStrictEqual(expectedOutput);
  });
});
