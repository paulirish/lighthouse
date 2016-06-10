/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../base/statistics.js");
require("../metric_registry.js");
require("./utils.js");
require("../../model/helpers/chrome_model_helper.js");
require("../../model/timed_event.js");
require("../../value/numeric.js");
require("../../value/value.js");

'use strict';

global.tr.exportTo('tr.metrics.sh', function() {
  var timeDurationInMs_smallerIsBetter =
      tr.v.Unit.byName.timeDurationInMs_smallerIsBetter;

  function findTargetRendererHelper(chromeHelper) {
    var largestPid = -1;
    for (var pid in chromeHelper.rendererHelpers) {
      var rendererHelper = chromeHelper.rendererHelpers[pid];
      if (rendererHelper.isChromeTracingUI)
        continue;
      if (pid > largestPid)
        largestPid = pid;
    }

    if (largestPid === -1)
      return undefined;

    return chromeHelper.rendererHelpers[largestPid];
  }

  function navigationStartFinder(rendererHelper) {
    var navigationStartsForFrameId = {};
    rendererHelper.mainThread.sliceGroup.iterateAllEventsInThisContainer(
        () => true, function(ev) {
          if (ev.category !== 'blink.user_timing' ||
              ev.title !== 'navigationStart')
            return;

          var frameIdRef = ev.args['frame'];
          var list = navigationStartsForFrameId[frameIdRef];
          if (list === undefined) {
              navigationStartsForFrameId[frameIdRef] = list = [];
          }
          list.unshift(ev);
        },
        this);

    return function findNavigationStartEventForFrameBeforeTimestamp(frameIdRef,
        ts) {
      var list = navigationStartsForFrameId[frameIdRef];
      if (list === undefined)
        throw new Error('No navigationStartEvent found for frame id "' +
            frameIdRef + '"');

      var eventBeforeTimestamp;
      list.forEach(function(ev) {
        if (ev.start > ts)
          return;

        if (eventBeforeTimestamp === undefined)
          eventBeforeTimestamp = ev;
      }, this);
      if (eventBeforeTimestamp === undefined)
        throw new Error('Failed to find navigationStartEvent.');
      return eventBeforeTimestamp;
    }
  }

  function paintFinder(rendererHelper) {
    var paintsForFrameId = {};
    rendererHelper.mainThread.sliceGroup.iterateAllEventsInThisContainer(
        () => true, function(ev) {
          if (ev.category !== 'devtools.timeline' || ev.title !== 'Paint')
            return;

          var frameIdRef = ev.args['data']['frame'];
          var list = paintsForFrameId[frameIdRef];
          if (list === undefined)
              paintsForFrameId[frameIdRef] = list = [];
          list.push(ev);
        },
        this);

    return function findPaintEventForFrameAfterTimestamp(frameIdRef, ts) {
      var list = paintsForFrameId[frameIdRef];
      if (list === undefined)
        return undefined;

      var eventAfterTimestamp;
      list.forEach(function(ev) {
        if (ev.start < ts)
          return;

        if (eventAfterTimestamp === undefined)
          eventAfterTimestamp = ev;
      }, this);
      return eventAfterTimestamp;
    }
  }

  var FIRST_PAINT_NUMERIC_BUILDER =
      new tr.v.NumericBuilder(timeDurationInMs_smallerIsBetter, 0)
      .addLinearBins(1000, 20) // 50ms step to 1s
      .addLinearBins(3000, 20) // 100ms step to 3s
      .addExponentialBins(20000, 20);
  function createHistogram() {
    var histogram = FIRST_PAINT_NUMERIC_BUILDER.build();
    histogram.customizeSummaryOptions({
      avg: true,
      count: false,
      max: true,
      min: true,
      std: true,
      sum: false,
      percentile: [0.90, 0.95, 0.99],
    });
    return histogram;
  }

  function findFrameLoaderSnapshotAt(rendererHelper, frameIdRef, ts) {
    var snapshot;

    var objects = rendererHelper.process.objects;
    var frameLoaderInstances = objects.instancesByTypeName_['FrameLoader'];
    if (frameLoaderInstances === undefined) {
      console.warn('Failed to find FrameLoader for frameId "' + frameIdRef +
          '" at ts ' + ts + ', the trace maybe incomplete or from an old' +
          'Chrome.');
      return undefined;
    }
    frameLoaderInstances.forEach(function(instance) {
      if (!instance.isAliveAt(ts))
        return;
      var maybeSnapshot = instance.getSnapshotAt(ts);
      if (frameIdRef !== maybeSnapshot.args['frame']['id_ref'])
        return;

      snapshot = maybeSnapshot;
    }, this);

    return snapshot;
  }

  function findAllUserTimingEvents(rendererHelper, title) {
    var targetEvents = [];

    rendererHelper.process.iterateAllEvents(
        function(ev) {
          if (ev.category !== 'blink.user_timing' ||
              ev.title !== title)
            return;

          targetEvents.push(ev);
        }, this);

    return targetEvents;
  }

  function findAllLayoutEvents(rendererHelper) {
    var isTelemetryInternalEvent =
        prepareTelemetryInternalEventPredicate(rendererHelper);
    var layoutsForFrameId = {};
    rendererHelper.process.iterateAllEvents(
        function(ev) {
          if (ev.category !==
              'blink,benchmark,disabled-by-default-blink.debug.layout' ||
              ev.title !== 'FrameView::performLayout')
            return;
          if (isTelemetryInternalEvent(ev))
            return;
          var frameIdRef = ev.args.counters['frame'];
          var list = layoutsForFrameId[frameIdRef];
          if (list === undefined)
            layoutsForFrameId[frameIdRef] = list = [];
          list.push(ev);
        }, this);
    return layoutsForFrameId;
  }

  function prepareTelemetryInternalEventPredicate(rendererHelper) {
    var ignoreRegions = [];

    var internalRegionStart;
    rendererHelper.mainThread.asyncSliceGroup.iterateAllEventsInThisContainer(
        () => true, function(slice) {
          if (!!slice.title.match(/^telemetry\.internal\.[^.]*\.start$/))
            internalRegionStart = slice.start;
          if (!!slice.title.match(/^telemetry\.internal\.[^.]*\.end$/)) {
            var timedEvent = new tr.model.TimedEvent(internalRegionStart);
            timedEvent.duration = slice.end - internalRegionStart;
            ignoreRegions.push(timedEvent);
          }
        }, this);

    return function isTelemetryInternalEvent(slice) {
      for (var i = 0; i < ignoreRegions.length; ++ i) {
        if (ignoreRegions[i].bounds(slice))
          return true;
      }
      return false;
    }
  }

  var URL_BLACKLIST = ['about:blank'];
  function shouldIgnoreURL(url) {
    return URL_BLACKLIST.indexOf(url) >= 0;
  }

  var METRICS = [
    {
      valueName: 'firstContentfulPaint',
      title: 'firstContentfulPaint',
      description: 'time to first contentful paint'
    },
    {
      valueName: 'timeToOnload',
      title: 'loadEventStart',
      description: 'time to onload. ' +
        'This is temporary metric used for PCv1/v2 sanity checking'
    }];

  function firstContentfulPaintMetric(values, model) {
    var chromeHelper = model.getOrCreateHelper(
        tr.model.helpers.ChromeModelHelper);
    var rendererHelper = findTargetRendererHelper(chromeHelper);
    var isTelemetryInternalEvent =
        prepareTelemetryInternalEventPredicate(rendererHelper);
    var findNavigationStartEventForFrameBeforeTimestamp =
        navigationStartFinder(rendererHelper);

    METRICS.forEach(function(metric) {
      var histogram = createHistogram();
      var targetEvents = findAllUserTimingEvents(rendererHelper, metric.title);
      targetEvents = targetEvents.filter(
          (ev) => !isTelemetryInternalEvent(ev));
      targetEvents.forEach(function(ev) {
        var frameIdRef = ev.args['frame'];
        var snapshot =
          findFrameLoaderSnapshotAt(rendererHelper, frameIdRef, ev.start);
        if (snapshot === undefined || !snapshot.args.isLoadingMainFrame)
          return;
        var url = snapshot.args.documentLoaderURL;
        if (shouldIgnoreURL(url))
          return;
        var navigationStartEvent =
          findNavigationStartEventForFrameBeforeTimestamp(frameIdRef, ev.start);

        var timeToEvent = ev.start - navigationStartEvent.start;
        histogram.add(timeToEvent, {url: url});
      }, this);
      values.addValue(new tr.v.NumericValue(
          metric.valueName, histogram,
          { description: metric.description }));
    }, this);
  }

  /**
   * Compute significance of given layout event.
   *
   * Significance of a layout is the number of layout objects newly added to the
   * layout tree, weighted by page height (before and after the layout).
   */
  function layoutSignificance(event) {
    var newObjects = event.args.counters['LayoutObjectsThatHadNeverHadLayout'];
    var visibleHeight = event.args['counters']['visibleHeight'];
    if (!newObjects || !visibleHeight)
      return 0;

    var heightBefore = event.args['contentsHeightBeforeLayout'];
    var heightAfter = event.args['counters']['contentsHeightAfterLayout'];
    var ratioBefore = Math.max(1, heightBefore / visibleHeight);
    var ratioAfter = Math.max(1, heightAfter / visibleHeight);
    return newObjects / ((ratioBefore + ratioAfter) / 2);
  }

  function hasTooManyBlankCharactersToBeMeaningful(event) {
    var BLOCK_FIRST_MEANINGFUL_PAINT_IF_BLANK_CHARACTERS_MORE_THAN = 200;
    return event.args['counters']['approximateBlankCharacterCount'] >
        BLOCK_FIRST_MEANINGFUL_PAINT_IF_BLANK_CHARACTERS_MORE_THAN;
  }

  function firstMeaningfulPaintMetric(values, model) {
    var chromeHelper = model.getOrCreateHelper(
        tr.model.helpers.ChromeModelHelper);
    var rendererHelper = findTargetRendererHelper(chromeHelper);
    var findNavigationStartEventForFrameBeforeTimestamp =
        navigationStartFinder(rendererHelper);
    var findPaintForFrameAfterTimestamp = paintFinder(rendererHelper);
    var firstMeaningfulPaintHistogram = createHistogram();

    function addFirstMeaningfulPaintSampleToHistogram(
        frameIdRef, navigationStart, mostSignificantLayout) {
      var snapshot = findFrameLoaderSnapshotAt(
          rendererHelper, frameIdRef, mostSignificantLayout.start);
      if (snapshot === undefined || !snapshot.args.isLoadingMainFrame)
        return;
      var url = snapshot.args.documentLoaderURL;
      if (shouldIgnoreURL(url))
        return;
      var paintEvent = findPaintForFrameAfterTimestamp(
          frameIdRef, mostSignificantLayout.start);
      if (paintEvent === undefined) {
        console.warn('Failed to find paint event after the most significant ' +
            'layout for frameId "' + frameIdRef + '".');
        return;
      }
      var timeToFirstMeaningfulPaint = paintEvent.start - navigationStart.start;
      firstMeaningfulPaintHistogram.add(timeToFirstMeaningfulPaint, {url: url});
    }

    var layoutsForFrameId = findAllLayoutEvents(rendererHelper);

    for (var frameIdRef in layoutsForFrameId) {
      var navigationStart;
      var mostSignificantLayout;
      var maxSignificanceSoFar = 0;
      var accumulatedSignificanceWhileHavingBlankText = 0;

      layoutsForFrameId[frameIdRef].forEach(function(ev) {
        var navigationStartForThisLayout =
          findNavigationStartEventForFrameBeforeTimestamp(frameIdRef, ev.start);

        if (navigationStart !== navigationStartForThisLayout) {
          if (navigationStart !== undefined &&
              mostSignificantLayout !== undefined)
            addFirstMeaningfulPaintSampleToHistogram(
                frameIdRef, navigationStart, mostSignificantLayout);
          navigationStart = navigationStartForThisLayout;
          mostSignificantLayout = undefined;
          maxSignificanceSoFar = 0;
          accumulatedSignificanceWhileHavingBlankText = 0;
        }

        var significance = layoutSignificance(ev);
        if (hasTooManyBlankCharactersToBeMeaningful(ev)) {
          accumulatedSignificanceWhileHavingBlankText += significance;
        } else {
          significance += accumulatedSignificanceWhileHavingBlankText;
          accumulatedSignificanceWhileHavingBlankText = 0;
          if (significance > maxSignificanceSoFar) {
            maxSignificanceSoFar = significance;
            mostSignificantLayout = ev;
          }
        }
      }, this);
      if (mostSignificantLayout !== undefined)
        addFirstMeaningfulPaintSampleToHistogram(
            frameIdRef, navigationStart, mostSignificantLayout);
    }

    values.addValue(new tr.v.NumericValue(
        'firstMeaningfulPaint', firstMeaningfulPaintHistogram,
        { description: 'time to first meaningful paint' }));
  }

  function firstPaintMetric(values, model) {
    firstContentfulPaintMetric(values, model);
    // TODO(ksakamoto@): Reenable firstMeaninfulPaintMetric
    // https://github.com/catapult-project/catapult/issues/2383
    //firstMeaningfulPaintMetric(values, model);
  }

  tr.metrics.MetricRegistry.register(firstPaintMetric);

  return {
    firstPaintMetric: firstPaintMetric
  };
});
