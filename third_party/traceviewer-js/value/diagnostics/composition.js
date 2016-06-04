/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./related_value_set.js");

'use strict';

global.tr.exportTo('tr.v.d', function() {
  /** @constructor */
  function Composition(opt_values) {
    tr.v.d.RelatedValueSet.call(this, opt_values);
  }

  Composition.prototype = {
    __proto__: tr.v.d.RelatedValueSet.prototype
  };

  Composition.fromDict = function(d) {
    return new Composition(d.guids.map(guid => new tr.v.d.ValueRef(guid)));
  };

  tr.v.d.Diagnostic.register(Composition);

  return {
    Composition: Composition
  };
});
