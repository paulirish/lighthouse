/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../base/iteration_helpers.js");
require("./diagnostic.js");

'use strict';

global.tr.exportTo('tr.v.d', function() {
  /** @constructor */
  function ValueRef(guid) {
    this.guid = guid;
  }

  /** @constructor */
  function RelatedValueSet(opt_values) {
    this.values_ = {};

    if (opt_values)
      opt_values.forEach(this.add, this);
  }

  RelatedValueSet.prototype = {
    __proto__: tr.v.d.Diagnostic.prototype,

    /**
     * Add a Value to this set.
     *
     * @param {!ValueRef|tr.v.Value} v
     */
    add: function(v) {
      if (!(v instanceof tr.v.Value) &&
          !(v instanceof ValueRef))
        throw new Error('Must be instanceof Value or ValueRef: ' + v);

      if (this.values_[v.guid])
        throw new Error('Tried to add same value twice');

      this.values_[v.guid] = v;
    },

    /**
     * @return {Array.<ValueRef|tr.v.Value>}
     */
    get values() {
      return tr.b.dictionaryValues(this.values_);
    },

    /**
     * Resolve all ValueRefs into Values by looking up their guids in valueSet.
     * If a value cannot be found and opt_required is true, then throw an Error.
     * If a value cannot be found and opt_required is false, then the ValueRef
     * will remain a ValueRef.
     *
     * @param {!tr.metrics.ValueSet} valueSet
     * @param {boolean=} opt_required
     */
    resolve: function(valueSet, opt_required) {
      tr.b.iterItems(this.values_, function(guid, value) {
        if (!(value instanceof ValueRef))
          return;

        value = valueSet.lookup(guid);
        if (value instanceof tr.v.Value)
          this.values_[guid] = value;
        else if (opt_required)
          throw new Error('Unable to find Value ' + guid);
      }, this);
    },

    _asDictInto: function(d) {
      d.guids = tr.b.dictionaryKeys(this.values_);
    }
  };

  RelatedValueSet.fromDict = function(d) {
    return new RelatedValueSet(d.guids.map(guid => new ValueRef(guid)));
  };

  tr.v.d.Diagnostic.register(RelatedValueSet);

  return {
    RelatedValueSet: RelatedValueSet,
    ValueRef: ValueRef
  };
});
