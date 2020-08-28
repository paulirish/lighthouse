/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @type {Array<Smokehouse.ExpectedRunnerResult>}
 * Expected Lighthouse artifacts from Form gatherer
 */
const expectations = [
  {
    artifacts: {
      FormElements: [
        {
          attributes: {
            id: 'checkout',
            name: 'checkout',
            autocomplete: 'on',
            nodeLabel: 'Name on card: \nCredit card number: \nExpiry Date: \nMM\n01\n02\n03\n04\n05\n06\n07\n08\n09…',
            snippet: '<form id="checkout" name="checkout" action="../done.html" method="post">',
          },
          inputs: [
            {
              id: 'name_cc1',
              name: 'name_cc1',
              placeholder: 'John Doe',
              autocompleteProp: '',
              autocompleteAttr: 'sectio-red shipping cc-namez',
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'textarea',
              snippet: '<textarea type="text" id="name_cc1" name="name_cc1" autocomplete="sectio-red shipping cc-namez" placeholder="John Doe" title="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: UNK…" autofill-information="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: UNK…" autofill-prediction="UNKNOWN_TYPE">',
            },
            {
              id: 'CCNo1',
              name: 'CCNo1',
              placeholder: '5555 5555 5555 5555',
              autocompleteProp: 'cc-number',
              autocompleteAttr: 'cc-number',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              nodeLabel: 'input',
              snippet: '<input type="text" id="CCNo1" name="CCNo1" autocomplete="cc-number" placeholder="5555 5555 5555 5555" title="overall type: HTML_TYPE_CREDIT_CARD_NUMBERnserver type: NO_SERVER_DATAnheu…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_NUMBERnserver type: NO_SERVER_DATAnheu…" autofill-prediction="HTML_TYPE_CREDIT_CARD_NUMBER">',
            },
            {
              id: 'CCExpiresMonth1',
              name: 'CCExpiresMonth1',
              autocompleteProp: 'cc-exp-month',
              autocompleteAttr: 'cc-exp-month',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_MONTH',
              nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
              snippet: '<select id="CCExpiresMonth1" name="CCExpiresMonth1" autocomplete="cc-exp-month" title="overall type: HTML_TYPE_CREDIT_CARD_EXP_MONTHnserver type: NO_SERVER_DATAn…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_EXP_MONTHnserver type: NO_SERVER_DATAn…" autofill-prediction="HTML_TYPE_CREDIT_CARD_EXP_MONTH">',
            },
            {
              id: 'CCExpiresYear1',
              name: '',
              autocompleteProp: 'section-red billing cc-exp-year',
              autocompleteAttr: 'section-red billing cc-exp-year',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_EXP_YEAR',
              nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
              snippet: '<select id="CCExpiresYear1" autocomplete="section-red billing cc-exp-year" title="overall type: HTML_TYPE_CREDIT_CARD_EXP_YEARnserver type: NO_SERVER_DATAnh…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_EXP_YEARnserver type: NO_SERVER_DATAnh…" autofill-prediction="HTML_TYPE_CREDIT_CARD_EXP_YEAR">',
            },
            {
              id: 'cvc1',
              name: 'cvc1',
              placeholder: '555',
              autocompleteProp: 'cc-csc',
              autocompleteAttr: 'cc-csc',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE',
              nodeLabel: 'input',
              snippet: '<input id="cvc1" name="cvc1" autocomplete="cc-csc" placeholder="555" title="overall type: HTML_TYPE_CREDIT_CARD_VERIFICATION_CODEnserver type: NO_SERV…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_VERIFICATION_CODEnserver type: NO_SERV…" autofill-prediction="HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE">',
            },
          ],
          labels: [
            {
              for: 'name_cc1',
              nodeLabel: 'Name on card:',
              snippet: '<label for="name_cc1">',
            },
            {
              for: 'CCNo1',
              nodeLabel: 'Credit card number:',
              snippet: '<label for="CCNo1">',
            },
            {
              for: 'CCExpiresMonth1',
              nodeLabel: 'Expiry Date:',
              snippet: '<label for="CCExpiresMonth1">',
            },
            {
              for: 'cvc1',
              nodeLabel: 'CVC:',
              snippet: '<label for="cvc1">',
            },
          ],
        },
        {
          /** All Elements in this object are formless because attributes is undefined */
          attributes: undefined,
          inputs: [
            {
              id: 'name_shipping',
              name: '',
              placeholder: 'John Doe',
              autocompleteProp: 'name',
              autocompleteAttr: 'name',
              autofillPredict: 'HTML_TYPE_NAME',
              nodeLabel: 'input',
              snippet: '<input type="text" id="name_shipping" autocomplete="name" placeholder="John Doe" title="overall type: HTML_TYPE_NAMEnserver type: NO_SERVER_DATAnheuristic type: N…" autofill-information="overall type: HTML_TYPE_NAMEnserver type: NO_SERVER_DATAnheuristic type: N…" autofill-prediction="HTML_TYPE_NAME">',
            },
            {
              id: 'address_shipping',
              name: '',
              placeholder: 'Your address',
              autocompleteProp: '',
              autocompleteAttr: 'shippin street-address',
              autofillPredict: 'ADDRESS_HOME_LINE1',
              nodeLabel: 'input',
              snippet: '<input type="text" id="address_shipping" autocomplete="shippin street-address" placeholder="Your address" title="overall type: ADDRESS_HOME_LINE1nserver type: NO_SERVER_DATAnheuristic typ…" autofill-information="overall type: ADDRESS_HOME_LINE1nserver type: NO_SERVER_DATAnheuristic typ…" autofill-prediction="ADDRESS_HOME_LINE1">',
            },
            {
              id: 'city_shipping',
              name: '',
              placeholder: 'city you live',
              autocompleteProp: '',
              autocompleteAttr: 'mobile section-red shipping address-level2',
              autofillPredict: 'ADDRESS_HOME_CITY',
              nodeLabel: 'input',
              snippet: '<input type="text" id="city_shipping" placeholder="city you live" autocomplete="mobile section-red shipping address-level2" title="overall type: ADDRESS_HOME_CITYnserver type: NO_SERVER_DATAnheuristic type…" autofill-information="overall type: ADDRESS_HOME_CITYnserver type: NO_SERVER_DATAnheuristic type…" autofill-prediction="ADDRESS_HOME_CITY">',
            },
            {
              id: 'state_shipping',
              name: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'ADDRESS_HOME_STATE',
              nodeLabel: 'Select a state\nCA\nMA\nNY\nMD\nOR\nOH\nIL\nDC',
              snippet: '<select id="state_shipping" title="overall type: ADDRESS_HOME_STATEnserver type: NO_SERVER_DATAnheuristic typ…" autofill-information="overall type: ADDRESS_HOME_STATEnserver type: NO_SERVER_DATAnheuristic typ…" autofill-prediction="ADDRESS_HOME_STATE">',
            },
            {
              id: 'zip_shipping',
              name: '',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'ADDRESS_HOME_ZIP',
              nodeLabel: 'input',
              snippet: '<input type="text" id="zip_shipping" title="overall type: ADDRESS_HOME_ZIPnserver type: NO_SERVER_DATAnheuristic type:…" autofill-information="overall type: ADDRESS_HOME_ZIPnserver type: NO_SERVER_DATAnheuristic type:…" autofill-prediction="ADDRESS_HOME_ZIP">',
            },
            {
              id: 'name_billing',
              name: 'name_billing',
              placeholder: 'your name',
              autocompleteProp: '',
              autocompleteAttr: 'sectio-red billing name',
              autofillPredict: 'NAME_FULL',
              nodeLabel: 'input',
              snippet: '<input type="text" id="name_billing" name="name_billing" placeholder="your name" autocomplete="sectio-red billing name" title="overall type: NAME_FULLnserver type: NO_SERVER_DATAnheuristic type: NAME_F…" autofill-information="overall type: NAME_FULLnserver type: NO_SERVER_DATAnheuristic type: NAME_F…" autofill-prediction="NAME_FULL">',
            },
            {
              id: 'address_billing',
              name: 'address_billing',
              placeholder: 'your address',
              autocompleteProp: 'billing street-address',
              autocompleteAttr: 'billing street-address',
              autofillPredict: 'HTML_TYPE_STREET_ADDRESS',
              nodeLabel: 'input',
              snippet: '<input type="text" id="address_billing" name="address_billing" autocomplete="billing street-address" placeholder="your address" title="overall type: HTML_TYPE_STREET_ADDRESSnserver type: NO_SERVER_DATAnheurist…" autofill-information="overall type: HTML_TYPE_STREET_ADDRESSnserver type: NO_SERVER_DATAnheurist…" autofill-prediction="HTML_TYPE_STREET_ADDRESS">',
            },
            {
              id: 'city_billing',
              name: 'city_billing',
              placeholder: 'city you live in',
              autocompleteProp: '',
              autocompleteAttr: 'section-red shipping ',
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'input',
              snippet: '<input type="text" id="city_billing" name="city_billing" placeholder="city you live in" autocomplete="section-red shipping " title="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: ADD…" autofill-information="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: ADD…" autofill-prediction="UNKNOWN_TYPE">',
            },
            {
              id: 'state_billing',
              name: 'state_billing',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'ADDRESS_HOME_STATE',
              nodeLabel: '\n            Select a state\n            CA\n            MA\n            NY\n      …',
              snippet: '<select id="state_billing" name="state_billing" title="overall type: ADDRESS_HOME_STATEnserver type: NO_SERVER_DATAnheuristic typ…" autofill-information="overall type: ADDRESS_HOME_STATEnserver type: NO_SERVER_DATAnheuristic typ…" autofill-prediction="ADDRESS_HOME_STATE">',
            },
            {
              id: 'zip_billing',
              name: '',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'ADDRESS_HOME_ZIP',
              nodeLabel: 'input',
              snippet: '<input type="text" id="zip_billing" title="overall type: ADDRESS_HOME_ZIPnserver type: NO_SERVER_DATAnheuristic type:…" autofill-information="overall type: ADDRESS_HOME_ZIPnserver type: NO_SERVER_DATAnheuristic type:…" autofill-prediction="ADDRESS_HOME_ZIP">',
            },
            {
              id: 'name_cc2',
              name: 'name_cc2',
              placeholder: '',
              autocompleteProp: 'cc-name',
              autocompleteAttr: 'cc-name',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NAME_FULL',
              nodeLabel: 'textarea',
              snippet: '<textarea type="text" id="name_cc2" name="name_cc2" autocomplete="cc-name" title="overall type: HTML_TYPE_CREDIT_CARD_NAME_FULLnserver type: NO_SERVER_DATAn…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_NAME_FULLnserver type: NO_SERVER_DATAn…" autofill-prediction="HTML_TYPE_CREDIT_CARD_NAME_FULL">',
            },
            {
              id: 'CCNo2',
              name: 'CCNo2',
              placeholder: '',
              autocompleteProp: 'section-red cc-number',
              autocompleteAttr: 'section-red cc-number',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_NUMBER',
              nodeLabel: 'input',
              snippet: '<input type="text" id="CCNo2" name="CCNo2" autocomplete="section-red cc-number" title="overall type: HTML_TYPE_CREDIT_CARD_NUMBERnserver type: NO_SERVER_DATAnheu…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_NUMBERnserver type: NO_SERVER_DATAnheu…" autofill-prediction="HTML_TYPE_CREDIT_CARD_NUMBER">',
            },
            {
              id: 'CCExpiresMonth2',
              name: 'CCExpiresMonth2',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'CREDIT_CARD_EXP_MONTH',
              nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
              snippet: '<select id="CCExpiresMonth2" name="CCExpiresMonth2" title="overall type: CREDIT_CARD_EXP_MONTHnserver type: NO_SERVER_DATAnheuristic …" autofill-information="overall type: CREDIT_CARD_EXP_MONTHnserver type: NO_SERVER_DATAnheuristic …" autofill-prediction="CREDIT_CARD_EXP_MONTH">',
            },
            {
              id: 'CCExpiresYear',
              name: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'CREDIT_CARD_EXP_4_DIGIT_YEAR',
              nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
              snippet: '<select id="CCExpiresYear" title="overall type: CREDIT_CARD_EXP_4_DIGIT_YEARnserver type: NO_SERVER_DATAnheu…" autofill-information="overall type: CREDIT_CARD_EXP_4_DIGIT_YEARnserver type: NO_SERVER_DATAnheu…" autofill-prediction="CREDIT_CARD_EXP_4_DIGIT_YEAR">',
            },
            {
              id: 'cvc2',
              name: 'cvc2',
              placeholder: '',
              autocompleteProp: 'cc-csc',
              autocompleteAttr: 'cc-csc',
              autofillPredict: 'HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE',
              nodeLabel: 'input',
              snippet: '<input id="cvc2" name="cvc2" autocomplete="cc-csc" title="overall type: HTML_TYPE_CREDIT_CARD_VERIFICATION_CODEnserver type: NO_SERV…" autofill-information="overall type: HTML_TYPE_CREDIT_CARD_VERIFICATION_CODEnserver type: NO_SERV…" autofill-prediction="HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE">',
            },
            {
              id: 'mobile-number',
              name: 'mobile-number',
              placeholder: '',
              autocompleteProp: 'section-red shipping mobile tel',
              autocompleteAttr: 'section-red shipping mobile tel',
              autofillPredict: 'HTML_TYPE_TEL',
              nodeLabel: 'input',
              snippet: '<input type="text" name="mobile-number" id="mobile-number" autocomplete="section-red shipping mobile tel" title="overall type: HTML_TYPE_TELnserver type: NO_SERVER_DATAnheuristic type: PH…" autofill-information="overall type: HTML_TYPE_TELnserver type: NO_SERVER_DATAnheuristic type: PH…" autofill-prediction="HTML_TYPE_TEL">',
            },
            {
              id: 'random',
              name: 'random',
              placeholder: '',
              autocompleteProp: '',
              autocompleteAttr: null,
              autofillPredict: 'UNKNOWN_TYPE',
              nodeLabel: 'input',
              snippet: '<input type="text" name="random" id="random" title="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: UNK…" autofill-information="overall type: UNKNOWN_TYPEnserver type: NO_SERVER_DATAnheuristic type: UNK…" autofill-prediction="UNKNOWN_TYPE">',
            },
          ],
          labels: [
            {
              for: 'name_shipping',
              nodeLabel: 'Name:',
              snippet: '<label for="name_shipping">',
            },
            {
              for: 'address_shipping',
              nodeLabel: 'Address:',
              snippet: '<label for="address_shipping">',
            },
            {
              for: 'city_shipping',
              nodeLabel: 'City:',
              snippet: '<label for="city_shipping">',
            },
            {
              for: 'Sstate_shipping',
              nodeLabel: 'State:',
              snippet: '<label for="Sstate_shipping">',
            },
            {
              for: 'zip_shipping',
              nodeLabel: 'Zip:',
              snippet: '<label for="zip_shipping">',
            },
            {
              for: 'name_billing',
              nodeLabel: 'Name:',
              snippet: '<label for="name_billing">',
            },
            {
              for: 'address_billing',
              nodeLabel: 'Address:',
              snippet: '<label for="address_billing">',
            },
            {
              for: 'city_billing',
              nodeLabel: 'City:',
              snippet: '<label for="city_billing">',
            },
            {
              for: 'state_billing',
              nodeLabel: 'State:',
              snippet: '<label for="state_billing">',
            },
            {
              for: 'zip_billing',
              nodeLabel: 'Zip:',
              snippet: '<label for="zip_billing">',
            },
            {
              for: 'name_cc2',
              nodeLabel: 'Name on card:',
              snippet: '<label for="name_cc2">',
            },
            {
              for: 'CCNo2',
              nodeLabel: 'Credit card number:',
              snippet: '<label for="CCNo2">',
            },
            {
              for: 'CCExpiresMonth2',
              nodeLabel: 'Expiry Date:',
              snippet: '<label for="CCExpiresMonth2">',
            },
            {
              for: 'cvc2',
              nodeLabel: 'CVC:',
              snippet: '<label for="cvc2">',
            },
            {
              for: 'mobile-number',
              nodeLabel: 'Mobile phone Number:',
              snippet: '<label for="mobile-number">',
            },
            {
              for: 'random',
              nodeLabel: 'Random Page Input:',
              snippet: '<label for="random">',
            },
          ],
        },
      ],
    },
    lhr: {
      requestedUrl: 'http://localhost:10200/form.html',
      finalUrl: 'http://localhost:10200/form.html',
      audits: {
        'autocomplete': {
          score: 0,
          details: {
            items: [
              {
                node: {
                  nodeLabel: 'textarea',
                  snippet: '<textarea type="text" id="name_cc1" name="name_cc1" autocomplete="sectio-red shipping cc-namez" placeholder="John Doe">',
                  type: 'node',
                },
                prefix: 'Review: sectio-red',
                suggestion: 'Requires manual review.',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="address_shipping" autocomplete="shippin street-address" placeholder="Your address">',
                  type: 'node',
                },
                prefix: 'Review: shippin',
                suggestion: 'address-line1',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="city_shipping" placeholder="city you live" autocomplete="mobile section-red shipping address-level2">',
                  type: 'node',
                },
                prefix: 'Review order of Autocomplete Tokens',
                suggestion: 'address-level2',
              },
              {
                node: {
                  nodeLabel: 'Select a state\nCA\nMA\nNY\nMD\nOR\nOH\nIL\nDC',
                  snippet: '<select id="state_shipping">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'address-level1',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="zip_shipping">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'postal-code',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="name_billing" name="name_billing" placeholder="your name" autocomplete="sectio-red billing name">',
                  type: 'node',
                },
                prefix: 'Review: sectio-red',
                suggestion: 'name',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="city_billing" name="city_billing" placeholder="city you live in" autocomplete="section-red shipping ">',
                  type: 'node',
                },
                prefix: 'Review order of Autocomplete Tokens',
                suggestion: 'Requires manual review.',
              },
              {
                node: {
                  nodeLabel: 'Select a state\nCA\nMA\nNY\nMD\nOR\nOH\nIL\nDC',
                  snippet: '<select id="state_billing" name="state_billing">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'address-level1',
              },
              {
                node: {
                  nodeLabel: 'input',
                  snippet: '<input type="text" id="zip_billing">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'postal-code',
              },
              {
                node: {
                  nodeLabel: 'MM\n01\n02\n03\n04\n05\n06\n07\n08\n09\n10\n11\n12',
                  snippet: '<select id="CCExpiresMonth2" name="CCExpiresMonth2">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'cc-exp-month',
              },
              {
                node: {
                  nodeLabel: 'YY\n2019\n2020\n2021\n2022\n2023\n2024\n2025\n2026\n2027\n2028\n2029',
                  snippet: '<select id="CCExpiresYear">',
                  type: 'node',
                },
                prefix: '',
                suggestion: 'cc-exp-year',
              },
            ],
          },
        },
      },
    },
  },
];


module.exports = expectations;
