/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/**
 * @fileoverview Audits a page to make sure all input elements
 *  have an autocomplete attribute set.
 * See https://docs.google.com/document/d/1yiulNnV8uEy1jPaAEmWeHxHcQOzxpqvAV4hOFpXLJ1M/edit?usp=sharing
 */

'use strict';

const Audit = require('./audit.js');
const i18n = require('../lib/i18n/i18n.js');

const UIStrings = {
  /** Title of a Lighthouse audit that lets the user know if there are any missing or invalid autocomplete attributes on page inputs. This descriptive title is shown to users when all input attributes have a valid autocomplete attribute. */
  title: 'Input elements use autocomplete',
  /** Title of a Lighthouse audit that lets the user know if there are any missing or invalid autocomplete attributes on page inputs. This descriptive title is shown to users when one or more inputs do not have autocomplete set or has an invalid autocomplete set. */
  failureTitle: 'Input elements do not have correct attributes for autocomplete',
  /** Description of a Lighthouse audit that lets the user know if there are any missing or invalid autocomplete attributes on page inputs. This is displayed after a user expands the section to see more. No character length limits. 'Learn More' becomes link text to additional documentation. */
  description: 'Autocomplete helps users submit forms quicker. To reduce user ' +
   'effort, consider enabling autocomplete by setting the `autocomplete` ' +
   'attribute to a valid value.' +
  ' [Learn more](https://developers.google.com/web/fundamentals/design-and-ux/input/forms#use_metadata_to_enable_auto-complete)',
  /** Label for a column in a data table; entries will be the autocomplete token suggestions based on heuristics. */
  columnAutocompleteSuggestions: 'Autocomplete Token Suggestions',
  /** Label for a column in a data table; entries will be the incorrect autocomplete prefix tokens or prompting user to review them. */
  columnAutocompletePrefixSuggestion: 'Autocomplete Prefix Token Check',
};

const str_ = i18n.createMessageInstanceIdFn(__filename, UIStrings);

/** @type {string[]} This array contains all acceptable autocomplete attributes from the WHATWG standard. More found at https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill */
const validAutocompleteTokens = ['name', 'honorific-prefix', 'given-name',
  'additional-name', 'family-name', 'honorific-suffix', 'nickname', 'username', 'new-password',
  'current-password', 'one-time-code', 'organization-title', 'organization', 'street-address',
  'address-line1', 'address-line2', 'address-line3', 'address-level4', 'address-level3',
  'address-level2', 'address-level1', 'country', 'country-name', 'postal-code', 'cc-name',
  'cc-given-name', 'cc-additional-name', 'cc-family-name', 'cc-number', 'cc-exp',
  'cc-exp-month', 'cc-exp-year', 'cc-csc', 'cc-type', 'transaction-currency',
  'transaction-amount', 'language', 'bday', 'bday-day', 'bday-month', 'bday-year',
  'sex', 'url', 'photo', 'tel', 'tel-country-code', 'tel-national', 'tel-area-code', 'on',
  'tel-local', 'tel-local-prefix', 'tel-local-suffix', 'tel-extension', 'email', 'impp', 'off',
  'additional-name-initial'];

/** @type {string[]} This array contains all acceptable autocomplete prefix tokens from the WHATWG standard. More found at https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill */
const validTokenPrefixes = ['home', 'work', 'mobile', 'fax', 'pager', 'shipping', 'billing'];

const noPrediction = ['NO_SERVER_DATA', 'UNKNOWN_TYPE', 'EMPTY_TYPE', 'HTML_TYPE_UNSPECIFIED',
  'HTML_TYPE_UNRECOGNIZED'];

const autofillSuggestions = {
  'NO_SERVER_DATA': 'Requires manual review.',
  'UNKNOWN_TYPE': 'Requires manual review.',
  'EMPTY_TYPE': 'Requires manual review.',
  'NAME_FIRST': 'given-name',
  'NAME_MIDDLE': 'additional-name',
  'NAME_LAST': 'family-name',
  'NAME_FULL': 'name',
  'NAME_MIDDLE_INITIAL': 'additional-name-initial',
  'NAME_SUFFIX': 'honorific-suffix',
  'NAME_BILLING_FIRST': 'billing given-name',
  'NAME_BILLING_MIDDLE': 'billing additional-name',
  'NAME_BILLING_LAST': 'billing family-name',
  'NAME_BILLING_MIDDLE_INITIAL': 'billing additional-name-initial',
  'NAME_BILLING_FULL': 'billing name',
  'NAME_BILLING_SUFFIX': 'billing honorific-suffix',
  'EMAIL_ADDRESS': 'email',
  'MERCHANT_EMAIL_SIGNUP': 'email',
  'PHONE_HOME_NUMBER': 'tel-local',
  'PHONE_HOME_CITY_CODE': 'tel-area-code',
  'PHONE_HOME_COUNTRY_CODE': 'tel-country-code',
  'PHONE_HOME_CITY_AND_NUMBER': 'tel-national',
  'PHONE_HOME_WHOLE_NUMBER': 'tel',
  'PHONE_HOME_EXTENSION': 'tel-extension',
  'PHONE_BILLING_NUMBER': 'billing tel-local',
  'PHONE_BILLING_CITY_CODE': 'billing tel-area-code',
  'PHONE_BILLING_COUNTRY_CODE': 'tel-country-code',
  'PHONE_BILLING_CITY_AND_NUMBER': 'tel-national',
  'PHONE_BILLING_WHOLE_NUMBER': 'tel',
  'ADDRESS_HOME_STREET_ADDRESS': 'street-address',
  'ADDRESS_HOME_LINE1': 'address-line1',
  'ADDRESS_HOME_LINE2': 'address-line2',
  'ADDRESS_HOME_LINE3': 'address-line3',
  'ADDRESS_HOME_STATE': 'address-level1',
  'ADDRESS_HOME_CITY': 'address-level2',
  'ADDRESS_HOME_DEPENDENT_LOCALITY': 'address-level3',
  'ADDRESS_HOME_ZIP': 'postal-code',
  'ADDRESS_HOME_COUNTRY': 'country-name',
  'ADDRESS_BILLING_DEPENDENT_LOCALITY': 'billing address-level3',
  'ADDRESS_BILLING_STREET_ADDRESS': 'billing street-address',
  'ADDRESS_BILLING_LINE1': 'billing address-line1',
  'ADDRESS_BILLING_LINE2': 'billing address-line2',
  'ADDRESS_BILLING_LINE3': 'billing address-line3',
  'ADDRESS_BILLING_APT_NUM': 'billing address-level3',
  'ADDRESS_BILLING_CITY': 'billing address-level2',
  'ADDRESS_BILLING_STATE': 'billing address-level1',
  'ADDRESS_BILLING_ZIP': 'billing postal-code',
  'ADDRESS_BILLING_COUNTRY': 'billing country-name',
  'CREDIT_CARD_NAME_FULL': 'cc-name',
  'CREDIT_CARD_NAME_FIRST': 'cc-given-name',
  'CREDIT_CARD_NAME_LAST': 'cc-family-name',
  'CREDIT_CARD_NUMBER': 'cc-number',
  'CREDIT_CARD_EXP_MONTH': 'cc-exp-month',
  'CREDIT_CARD_EXP_2_DIGIT_YEAR': 'cc-exp-year',
  'CREDIT_CARD_EXP_4_DIGIT_YEAR': 'cc-exp-year',
  'CREDIT_CARD_EXP_DATE_2_DIGIT_YEAR': 'cc-exp',
  'CREDIT_CARD_EXP_DATE_4_DIGIT_YEAR': 'cc-exp',
  'CREDIT_CARD_TYPE': 'cc-type',
  'CREDIT_CARD_VERIFICATION_CODE': 'cc-csc',
  'COMPANY_NAME': 'organization',
  'PASSWORD': 'current-password',
  'ACCOUNT_CREATION_PASSWORD': 'new-password',
  'HTML_TYPE_UNSPECIFIED': 'Requires manual review.',
  'HTML_TYPE_NAME': 'name',
  'HTML_TYPE_HONORIFIC_PREFIX': 'honorific-prefix',
  'HTML_TYPE_GIVEN_NAME': 'given-name',
  'HTML_TYPE_ADDITIONAL_NAME': 'additional-name',
  'HTML_TYPE_FAMILY_NAME': 'family-name',
  'HTML_TYPE_ORGANIZATION': 'organization',
  'HTML_TYPE_STREET_ADDRESS': 'street-address',
  'HTML_TYPE_ADDRESS_LINE1': 'address-line1',
  'HTML_TYPE_ADDRESS_LINE2': 'address-line2',
  'HTML_TYPE_ADDRESS_LINE3': 'address-line3',
  'HTML_TYPE_ADDRESS_LEVEL1': 'address-level1',
  'HTML_TYPE_ADDRESS_LEVEL2': 'address-level2',
  'HTML_TYPE_ADDRESS_LEVEL3': 'address-level3',
  'HTML_TYPE_COUNTRY_CODE': 'tel-country-code',
  'HTML_TYPE_COUNTRY_NAME': 'country-name',
  'HTML_TYPE_POSTAL_CODE': 'postal-code',
  'HTML_TYPE_FULL_ADDRESS': 'street-address',
  'HTML_TYPE_CREDIT_CARD_NAME_FULL': 'cc-name',
  'HTML_TYPE_CREDIT_CARD_NAME_FIRST': 'cc-given-name',
  'HTML_TYPE_CREDIT_CARD_NAME_LAST': 'cc-family-name',
  'HTML_TYPE_CREDIT_CARD_NUMBER': 'cc-number',
  'HTML_TYPE_CREDIT_CARD_EXP': 'cc-exp',
  'HTML_TYPE_CREDIT_CARD_EXP_MONTH': 'cc-exp-month',
  'HTML_TYPE_CREDIT_CARD_EXP_YEAR': 'cc-exp-year',
  'HTML_TYPE_CREDIT_CARD_VERIFICATION_CODE': 'cc-csc',
  'HTML_TYPE_CREDIT_CARD_TYPE': 'cc-csc',
  'HTML_TYPE_TEL': 'tel',
  'HTML_TYPE_TEL_COUNTRY_CODE': 'tel-country-code',
  'HTML_TYPE_TEL_NATIONAL': 'tel-national',
  'HTML_TYPE_TEL_AREA_CODE': 'tel-area-code',
  'HTML_TYPE_TEL_LOCAL': 'tel-local',
  'HTML_TYPE_TEL_LOCAL_PREFIX': 'tel-local-prefix',
  'HTML_TYPE_TEL_LOCAL_SUFFIX': 'tel-local-suffix',
  'HTML_TYPE_TEL_EXTENSION': 'tel-extension',
  'HTML_TYPE_EMAIL': 'email',
  'HTML_TYPE_ADDITIONAL_NAME_INITIAL': 'additional-name-initial',
  'HTML_TYPE_CREDIT_CARD_EXP_DATE_2_DIGIT_YEAR': 'cc-exp-year',
  'HTML_TYPE_CREDIT_CARD_EXP_DATE_4_DIGIT_YEAR': 'cc-exp-year',
  'HTML_TYPE_CREDIT_CARD_EXP_2_DIGIT_YEAR': 'cc-exp-year',
  'HTML_TYPE_CREDIT_CARD_EXP_4_DIGIT_YEAR': 'cc-exp-year',
  'HTML_TYPE_UPI_VPA': 'Requires manual review.',
  'HTML_TYPE_ONE_TIME_CODE': 'one-time-code',
  'HTML_TYPE_UNRECOGNIZED': 'Requires manual review.',
  'HTML_TYPE_TRANSACTION_AMOUNT': 'transaction-amount',
  'HTML_TYPE_TRANSACTION_CURRENCY': 'transaction-currency',
};

class AutocompleteAudit extends Audit {
  /**
   * @return {LH.Audit.Meta}
   */
  static get meta() {
    return {
      id: 'autocomplete',
      title: str_(UIStrings.title),
      failureTitle: str_(UIStrings.failureTitle),
      description: str_(UIStrings.description),
      requiredArtifacts: ['FormElements'],
    };
  }

  /**
   * @param {string[]} tokenArray
   * @return {string[]}
   */
  static isValidAutocompletePrefix(tokenArray) {
    const invalid = [];
    for (const token of tokenArray) {
      if (token.slice(0, 8) === 'section-') {
        continue;
      }
      if (validTokenPrefixes.includes(token)) {
        continue;
      }
      invalid.push(token);
    }
    return invalid;
  }

  /**
   * @param {LH.Artifacts.FormInput} input
   * @return {{attribute: Boolean, prefixSuggestion: string}
   */
  static isValidAutocomplete(input) {
    if (!input.autocompleteAttr) return {attribute: false, prefixSuggestion: ''};
    if (input.autocompleteAttr.includes(' ') ) {
      const tokenArray = input.autocompleteAttr.split(' ');
      const invalidPrefixes = this.isValidAutocompletePrefix(
        tokenArray.slice(0, tokenArray.length - 1));
      let prefixSuggestion = '';
      if (invalidPrefixes.length > 0) {
        prefixSuggestion = 'Review: ' + invalidPrefixes.join(', ');
      }
      if (invalidPrefixes.length === 0 && !input.autocompleteProp) {
        prefixSuggestion = 'Review order of Autocomplete Tokens';
      }
      return {
        attribute: validAutocompleteTokens.includes(tokenArray[tokenArray.length - 1]),
        prefixSuggestion: prefixSuggestion,
      };
    }
    return {
      attribute: validAutocompleteTokens.includes(input.autocompleteAttr),
      prefixSuggestion: '',
    };
  }
  /**
   * @param {LH.Artifacts} artifacts
   * @return {LH.Audit.Product}
   */
  static audit(artifacts) {
    const forms = artifacts.FormElements;
    const failingFormsData = [];
    for (const form of forms) {
      for (const input of form.inputs) {
        const valid = this.isValidAutocomplete(input);
        if (!valid.attribute || valid.prefixSuggestion) {
          if (!input.autofillPredict) continue;
          if (noPrediction.includes(input.autofillPredict) && !input.autocompleteAttr) continue;
          if (input.autofillPredict in autofillSuggestions) {
            const snippetArray = input.snippet.split(' title=');
            const snippet = snippetArray[0] + '>';
            failingFormsData.push({
              node: /** @type {LH.Audit.Details.NodeValue} */ ({
                type: 'node',
                snippet: snippet,
                nodeLabel: input.nodeLabel,
              }),
              // @ts-ignore
              suggestion: autofillSuggestions[input.autofillPredict],
              prefix: valid.prefixSuggestion,
            });
          }
        }
      }
    }

    /** @type {LH.Audit.Details.Table['headings']} */
    const headings = [
      {key: 'node', itemType: 'node', text: str_(i18n.UIStrings.columnFailingElem)},
      {key: 'suggestion', itemType: 'text', text: str_(UIStrings.columnAutocompleteSuggestions)},
      {key: 'prefix', itemType: 'text', text: str_(UIStrings.columnAutocompletePrefixSuggestion)},
    ];
    const details = Audit.makeTableDetails(headings, failingFormsData);
    let displayValue;
    if (failingFormsData.length > 0) {
      displayValue = str_(i18n.UIStrings.displayValueElementsFound,
        {nodeCount: failingFormsData.length});
    }
    return {
      score: (failingFormsData.length > 0) ? 0 : 1,
      displayValue,
      details,
    };
  }
}

module.exports = AutocompleteAudit;
module.exports.UIStrings = UIStrings;
