/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env jest */

const FontSizeGather = require('../../../../gather/gatherers/seo/font-size');
let fontSizeGather;

const smallText = ' body sm𝐀ll text ';
const bigText = 'body 𝐁ig text';
const failingText = 'failing text 💩';
const bodyNode = {nodeId: 3, nodeName: 'BODY', parentId: 1};
const failingNode = {nodeId: 10, nodeName: 'P', parentId: 3};
const nodes = [
  {nodeId: 1, nodeName: 'HTML'},
  {nodeId: 2, nodeName: 'HEAD', parentId: 1},
  bodyNode,
  {
    nodeId: 4,
    nodeValue: 'head text',
    nodeType: FontSizeGather.TEXT_NODE_TYPE,
    parentId: 2,
  },
  {
    nodeId: 5,
    nodeValue: smallText,
    nodeType: FontSizeGather.TEXT_NODE_TYPE,
    parentId: 3,
  },
  {nodeId: 6, nodeName: 'H1', parentId: 3},
  {
    nodeId: 7,
    nodeValue: bigText,
    nodeType: FontSizeGather.TEXT_NODE_TYPE,
    parentId: 6,
  },
  {nodeId: 8, nodeName: 'SCRIPT', parentId: 3},
  {
    nodeId: 9,
    nodeValue: 'script text',
    nodeType: FontSizeGather.TEXT_NODE_TYPE,
    parentId: 8,
  },
  failingNode,
  {
    nodeId: 11,
    nodeValue: failingText,
    nodeType: FontSizeGather.TEXT_NODE_TYPE,
    parentId: 10,
  },
];

describe('Font size gatherer', () => {
  // Reset the Gatherer before each test.
  beforeEach(() => {
    fontSizeGather = new FontSizeGather();
  });

  it('returns information about font sizes used on page', async () => {
    const driver = {
      on() {},
      off() {},
      async sendCommand(command, params) {
        if (command === 'CSS.getComputedStyleForNode') {
          if (params.nodeId === failingNode.nodeId) {
            throw new Error('This is the failing node');
          }

          return {
            computedStyle: [
              {
                name: 'font-size',
                value: params.nodeId === bodyNode.nodeId ? 10 : 20,
              },
            ],
          };
        } else if (command === 'CSS.getMatchedStylesForNode') {
          return {
            inlineStyle: null,
            attributesStyle: null,
            matchedCSSRules: [],
            inherited: [],
          };
        }
      },
      async getNodesInDocument() {
        return nodes;
      },
    };

    const artifact = await fontSizeGather.afterPass({driver});
    const expectedFailingTextLength = Array.from(smallText.trim()).length;
    const expectedVisitedTextLength = Array.from(bigText.trim()).length + expectedFailingTextLength;
    const expectedTotalTextLength = Array.from(failingText.trim()).length +
      expectedVisitedTextLength;
    const expectedAnalyzedFailingTextLength = expectedFailingTextLength;

    expect(artifact).toEqual({
      analyzedFailingTextLength: expectedAnalyzedFailingTextLength,
      failingTextLength: expectedFailingTextLength,
      visitedTextLength: expectedVisitedTextLength,
      totalTextLength: expectedTotalTextLength,
      analyzedFailingNodesData: [
        {
          fontSize: 10,
          node: bodyNode,
          textLength: expectedFailingTextLength,
        },
      ],
    });
  });

  describe('#computeSelectorSpecificity', () => {
    const compute = FontSizeGather.computeSelectorSpecificity;

    it('should handle basic selectors', () => {
      expect(compute('h1')).toEqual(1);
      expect(compute('h1 > p > span')).toEqual(3);
    });

    it('should handle class selectors', () => {
      expect(compute('h1.foo')).toEqual(11);
      expect(compute('h1 > p.other.yeah > span')).toEqual(23);
    });

    it('should handle ID selectors', () => {
      expect(compute('h1#awesome.foo')).toEqual(111);
      expect(compute('h1 > p.other > span#the-text')).toEqual(113);
    });

    it('should cap the craziness', () => {
      expect(compute('h1.a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p')).toEqual(91);
    });
  });

  describe('#getEffectiveFontRule', () => {
    const createProps = props => Object.entries(props).map(([name, value]) => ({name, value}));
    const createStyle = ({properties, id}) => ({
      styleSheetId: id,
      cssProperties: createProps(properties),
    });
    const createRule = ({style, selectors, origin}) => ({
      style,
      origin,
      selectorList: {selectors: selectors.map(text => ({text}))},
    });

    let inlineStyle;
    let matchedCSSRules;
    let inherited;

    beforeEach(() => {
      const fontRule = createRule({
        origin: 'regular',
        selectors: ['html body *', '#main'],
        style: createStyle({id: 123, properties: {'font-size': '1em'}}),
      });
      const userAgentRule = createRule({
        origin: 'user-agent',
        selectors: ['body'],
        style: createStyle({properties: {'font-size': 12}}),
      });

      inlineStyle = createStyle({id: 1, properties: {'font-size': '1em'}});
      matchedCSSRules = [{matchingSelectors: [1], rule: fontRule}];
      inherited = [{matchedCSSRules: [{matchingSelectors: [0], rule: userAgentRule}]}];
    });

    it('should identify inline styles', () => {
      const result = FontSizeGather.getEffectiveFontRule({inlineStyle});
      expect(result).toEqual({
        cssProperties: [
          {
            name: 'font-size',
            value: '1em',
          },
        ],
        styleSheetId: 1,
        type: 'Inline',
      });
    });

    it('should identify direct CSS rules', () => {
      const result = FontSizeGather.getEffectiveFontRule({matchedCSSRules});
      expect(result).toEqual({
        cssProperties: [
          {
            name: 'font-size',
            value: '1em',
          },
        ],
        parentRule: {
          origin: 'regular',
          selectors: [
            {
              text: 'html body *',
            },
            {
              text: '#main',
            },
          ],
        },
        styleSheetId: 123,
        type: 'Regular',
      });
    });

    it('should identify inherited CSS rules', () => {
      const result = FontSizeGather.getEffectiveFontRule({inherited});
      expect(result).toEqual({
        cssProperties: [
          {
            name: 'font-size',
            value: 12,
          },
        ],
        parentRule: {
          origin: 'user-agent',
          selectors: [
            {
              text: 'body',
            },
          ],
        },
        styleSheetId: undefined,
        type: 'Regular',
      });
    });

    it('should respect precendence', () => {
      let result = FontSizeGather.getEffectiveFontRule({inlineStyle, matchedCSSRules, inherited});
      expect(result).toMatchObject({type: 'Inline'});
      result = FontSizeGather.getEffectiveFontRule({matchedCSSRules, inherited});
      expect(result.parentRule).toMatchObject({origin: 'regular'});
      result = FontSizeGather.getEffectiveFontRule({inherited});
      expect(result.parentRule).toMatchObject({origin: 'user-agent'});
      result = FontSizeGather.getEffectiveFontRule({});
      expect(result).toBe(undefined);
    });

    it('should use the most specific selector', () => {
      // Just 1 class
      const fontRuleA = createRule({
        origin: 'regular',
        selectors: ['.main'],
        style: createStyle({id: 1, properties: {'font-size': '1em'}}),
      });

      // Two matching selectors where 2nd is the global most specific, ID + class
      const fontRuleB = createRule({
        origin: 'regular',
        selectors: ['html body *', '#main.foo'],
        style: createStyle({id: 2, properties: {'font-size': '2em'}}),
      });

      // Just ID
      const fontRuleC = createRule({
        origin: 'regular',
        selectors: ['#main'],
        style: createStyle({id: 3, properties: {'font-size': '3em'}}),
      });

      const matchedCSSRules = [
        {rule: fontRuleA, matchingSelectors: [0]},
        {rule: fontRuleB, matchingSelectors: [0, 1]},
        {rule: fontRuleC, matchingSelectors: [0]},
      ];

      const result = FontSizeGather.getEffectiveFontRule({matchedCSSRules});
      // fontRuleB should have one for ID + class
      expect(result.styleSheetId).toEqual(2);
    });

    it('should break ties with last one declared', () => {
      const fontRuleA = createRule({
        origin: 'regular',
        selectors: ['.main'],
        style: createStyle({id: 1, properties: {'font-size': '1em'}}),
      });

      const fontRuleB = createRule({
        origin: 'regular',
        selectors: ['.other'],
        style: createStyle({id: 2, properties: {'font-size': '2em'}}),
      });

      const matchedCSSRules = [
        {rule: fontRuleA, matchingSelectors: [0]},
        {rule: fontRuleB, matchingSelectors: [0]},
      ];

      const result = FontSizeGather.getEffectiveFontRule({matchedCSSRules});
      expect(result.styleSheetId).toEqual(2);
    });
  });
});
