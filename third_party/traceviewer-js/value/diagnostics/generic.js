/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./diagnostic.js");

'use strict';

global.tr.exportTo('tr.v.d', function() {
  /**
   * A Generic diagnostic can contain any Plain-Ol'-Data objects that can be
   * serialized using JSON.stringify(): null, boolean, number, string, array,
   * dict. Generic diagnostics cannot contain tr.v.Value objects!
   *
   * @constructor
   * @param {*} value
   */
  function Generic(value) {
    this.value = value;
  }

  Generic.prototype = {
    __proto__: tr.v.d.Diagnostic.prototype,

    _asDictInto: function(d) {
      d.value = this.value;
    }
  };

  Generic.fromDict = function(d) {
    return new Generic(d.value);
  };

  tr.v.d.Diagnostic.register(Generic);

  return {
    Generic: Generic
  };
});
