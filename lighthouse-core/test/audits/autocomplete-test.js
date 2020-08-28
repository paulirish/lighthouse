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
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NAME_FULL',
              nodeLabel: 'input',
              snippet: '<input type="text" name="name_cc">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo">',
            },
            {
              id: '',
              name: 'CCExpiresMonth',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'CREDIT_CARD_EXP_MONTH',
              nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
              snippet: '<select name="CCExpiresMonth">',
            },
            {
              id: '',
              name: 'CCExpiresYear',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'CREDIT_CARD_EXP_4_DIGIT_YEAR',
              nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
              snippet: '<select name="CCExpiresYear">',
            },
            {
              id: '',
              name: 'cvc',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE',
              nodeLabel: 'input',
              snippet: '<input name="cvc">',
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
            nodeLabel: 'input',
            snippet: '<input type="text" name="name_cc">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-name',
        },
        {
          node: {
            nodeLabel: 'input',
            snippet: '<input type="text" name="CCNo">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-number',
        },
        {
          node: {
            nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
            snippet: '<select name="CCExpiresMonth">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-exp-month',
        },
        {
          node: {
            nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
            snippet: '<select name="CCExpiresYear">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-exp-year',
        },
        {
          node: {
            nodeLabel: 'input',
            snippet: '<input name="cvc">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-csc',
        },
      ],
      summary: undefined,
      type: 'table',
    };
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details).toStrictEqual(expectedDetails);
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
              autocompleteProp: '',
              autocompleteAttr: 'namez',
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'input',
              snippet: '<input type="text" name="name_cc" autocomplete="namez">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'ccc-num',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo" autocomplete="ccc-num">',
            },
            {
              id: '',
              name: 'CCExpiresMonth',
              autocompleteProp: '',
              autocompleteAttr: 'ccc-exp',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_MONTH',
              nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
              snippet: '<select name="CCExpiresMonth" autocomplete="ccc-exp">',
            },
            {
              id: '',
              name: 'CCExpiresYear',
              autocompleteProp: '',
              autocompleteAttr: 'none',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_YEAR',
              nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
              snippet: '<select name="CCExpiresYear" autocomplete="none">',
            },
            {
              id: '',
              name: 'cvc',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: 'cc-cvc',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE',
              nodeLabel: 'input',
              snippet: '<input name="cvc" autocomplete="cc-cvc">',
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
            nodeLabel: 'input',
            snippet: '<input type="text" name="name_cc" autocomplete="namez">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'Requires manual review.',
        },
        {
          node: {
            nodeLabel: 'input',
            snippet: '<input type="text" name="CCNo" autocomplete="ccc-num">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-number',
        },
        {
          node: {
            nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
            snippet: '<select name="CCExpiresMonth" autocomplete="ccc-exp">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-exp-month',
        },
        {
          node: {
            nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
            snippet: '<select name="CCExpiresYear" autocomplete="none">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-exp-year',
        },
        {
          node: {
            nodeLabel: 'input',
            snippet: '<input name="cvc" autocomplete="cc-cvc">>',
            type: 'node',
          },
          prefix: '',
          suggestion: 'cc-csc',
        },
      ],
      summary: undefined,
      type: 'table',
    };
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details).toStrictEqual(expectedDetails);
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
              autocompleteProp: 'section-red shipping cc-name',
              autocompleteAttr: 'cc-name',
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'textarea',
              // eslint-disable-next-line max-len
              snippet: '<textarea type="text" name="name_cc" autocomplete="section-red shipping cc-name">',
            },
            {
              id: '',
              name: 'CCNo',
              placeholder: '',
              autocompleteProp: 'cc-number',
              autocompleteAttr: 'cc-number',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              nodeLabel: 'input',
              snippet: '<input type="text" name="CCNo" autocomplete="cc-number">',
            },
            {
              id: '',
              name: 'CCExpiresMonth',
              autocompleteProp: 'cc-exp-year',
              autocompleteAttr: 'cc-exp-year',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_MONTH',
              nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
              snippet: '<select name="CCExpiresMonth" autocomplete="cc-exp-month">',
            },
            {
              id: '',
              name: 'CCExpiresYear',
              autocompleteProp: 'cc-exp-year',
              autocompleteAttr: 'cc-exp-year',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_YEAR',
              nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
              snippet: '<select name="CCExpiresYear" autocomplete="cc-exp-year">',
            },
            {
              id: '',
              name: 'mobile-number',
              placeholder: '',
              autocompleteProp: 'section-red shipping mobile tel',
              autocompleteAttr: 'section-red shipping mobile tel',
              autofillPredict: 'HTML_TYPE_TEL',
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
  it('passes when an there is no autofill prediction and no attribute set', () => {
    const artifacts = {
      FormElements: [
        {
          inputs: [
            {
              id: '',
              name: 'edge_case',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'textarea',
              snippet: '<textarea type="text" name="edge_case">',
            },
            {
              id: '',
              name: 'random',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'input',
              snippet: '<input type="text" name="random">',
            },
          ],
          labels: [],
        },
      ],
    };
    const {score} = Autocomplete.audit(artifacts);
    expect(score).toBe(1);
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
            snippet: '<textarea type="text" name="name_cc2" autocomplete="sectio-red cc-name">>',
            type: 'node',
          },
          prefix: 'Review: sectio-red',
          suggestion: 'cc-name',
        },
        {
          node: {
            nodeLabel: 'input',
            snippet: '<input type="text" name="CCNo2" autocomplete="shippin name">>',
            type: 'node',
          },
          prefix: 'Review: shippin',
          suggestion: 'name',
        },
      ],
      summary: undefined,
      type: 'table',
    };
    const {score, details} = Autocomplete.audit(artifacts);
    expect(score).toBe(0);
    expect(details).toStrictEqual(expectedDetails);
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
            snippet: '<textarea type="text" name="name_cc2" autocomplete="shipping section-red cc-name">>',
            type: 'node',
          },
          prefix: 'Review order of Autocomplete Tokens',
          suggestion: 'cc-name',
        },
        {
          node: {
            nodeLabel: 'input',
            // eslint-disable-next-line max-len
            snippet: '<input type="text" name="CCNo2" autocomplete="shipping section-red  mobile tel">>',
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
