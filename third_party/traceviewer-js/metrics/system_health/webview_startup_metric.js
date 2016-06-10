/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../metric_registry.js");
require("./utils.js");
require("../../value/numeric.js");
require("../../value/value.js");

'use strict';

global.tr.exportTo('tr.metrics.sh', function() {
  function webviewStartupMetric(values, model) {
    model.iterateAllEvents(function(slice) {
      // WebViewStartupInterval is the title of the section of code that is
      // entered (via android.os.Trace.beginSection) when WebView is started
      // up. This value is defined in TelemetryActivity.java.
      if (!(slice instanceof tr.model.Slice))
        return;
      if (slice.title === 'WebViewStartupInterval') {
        values.addValue(new tr.v.NumericValue(
            'webview_startup_time',
            new tr.v.ScalarNumeric(
                tr.v.Unit.byName.timeDurationInMs_smallerIsBetter,
                slice.duration),
            { description: 'WebView startup time' }));
      }
      // WebViewBlankUrlLoadInterval is the title of the section of code
      // that is entered (via android.os.Trace.beginSection) when WebView
      // is started up. This value is defined in TelemetryActivity.java.
      if (slice.title === 'WebViewBlankUrlLoadInterval') {
        values.addValue(new tr.v.NumericValue(
            'webview_url_load_time',
            new tr.v.ScalarNumeric(
                tr.v.Unit.byName.timeDurationInMs_smallerIsBetter,
                slice.duration),
            { description: 'WebView blank URL load time' }));
      }
    });
  };

  tr.metrics.MetricRegistry.register(webviewStartupMetric);

  return {
    webviewStartupMetric: webviewStartupMetric
  };
});
