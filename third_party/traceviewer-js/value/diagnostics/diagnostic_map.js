/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("./composition.js");
require("./generic.js");

'use strict';

global.tr.exportTo('tr.v.d', function() {
  /** @constructor */
  function DiagnosticMap() {
    this.diagnosticsByName_ = {};
  }

  DiagnosticMap.prototype = {
    /**
     * Add a new Diagnostic to this map.
     *
     * @param {string} name
     * @param {!tr.v.d.Diagnostic} diagnostic
     */
    add: function(name, diagnostic) {
      if (!(diagnostic instanceof tr.v.d.Diagnostic))
        throw new Error('Must be instanceof Diagnostic: ' + diagnostic);

      if (typeof(name) !== 'string')
        throw new Error('name must be string, not ' + name);

      if (this.diagnosticsByName_[name])
        throw new Error('Attempt to add duplicate diagnostic ' + name);

      this.diagnosticsByName_[name] = diagnostic;
    },

    /**
     * Add Diagnostics from a dictionary of dictionaries.
     *
     * @param {Object} dict
     */
    addDicts: function(dict) {
      tr.b.iterItems(dict, function(name, diagnosticDict) {
        this.add(name, tr.v.d.Diagnostic.fromDict(diagnosticDict));
      }, this);
    },

    /**
     * @param {string} name
     * @return {tr.v.d.Diagnostic}
     */
    get: function(name) {
      return this.diagnosticsByName_[name];
    },

    /**
     * Iterate over this map's key-value-pairs.
     *
     * @param {function(string, tr.v.d.Diagnostic)} cb
     * @param {Object=} opt_this
     */
    forEach: function(cb, opt_this) {
      tr.b.iterItems(this.diagnosticsByName_, cb, opt_this || this);
    },

    asDict: function() {
      var dict = {};
      this.forEach(function(name, diagnostic) {
        dict[name] = diagnostic.asDict();
      });
      return dict;
    }
  };

  DiagnosticMap.fromDict = function(d) {
    var diagnostics = new DiagnosticMap();
    diagnostics.addDicts(d);
    return diagnostics;
  };

  return {
    DiagnosticMap: DiagnosticMap
  };
});
