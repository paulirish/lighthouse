/**
Copyright 2016 The Chromium Authors. All rights reserved.
Use of this source code is governed by a BSD-style license that can be
found in the LICENSE file.
**/

require("../../base/iteration_helpers.js");
require("../../base/range.js");
require("../metric_registry.js");
require("../../model/container_memory_dump.js");
require("../../model/helpers/chrome_model_helper.js");
require("../../model/memory_allocator_dump.js");
require("../../value/numeric.js");
require("../../value/unit.js");
require("../../value/value.js");

'use strict';

global.tr.exportTo('tr.metrics.sh', function() {

  var LIGHT = tr.model.ContainerMemoryDump.LevelOfDetail.LIGHT;
  var DETAILED = tr.model.ContainerMemoryDump.LevelOfDetail.DETAILED;
  var ScalarNumeric = tr.v.ScalarNumeric;
  var sizeInBytes_smallerIsBetter =
      tr.v.Unit.byName.sizeInBytes_smallerIsBetter;
  var unitlessNumber_smallerIsBetter =
      tr.v.Unit.byName.unitlessNumber_smallerIsBetter;

  var MMAPS_VALUES = {
    'overall:pss': {
      path: [],
      byteStat: 'proportionalResident',
      descriptionPrefix: 'total proportional resident size (PSS) of'
    },
    'overall:private_dirty': {
      path: [],
      byteStat: 'privateDirtyResident',
      descriptionPrefix: 'total private dirty size of'
    },
    'java_heap:private_dirty': {
      path: ['Android', 'Java runtime', 'Spaces'],
      byteStat: 'privateDirtyResident',
      descriptionPrefix: 'private dirty size of the Java heap in'
    },
    'ashmem:pss': {
      path: ['Android', 'Ashmem'],
      byteStat: 'proportionalResident',
      descriptionPrefix: 'proportional resident size (PSS) of ashmem in'
    },
    'native_heap:pss': {
      path: ['Native heap'],
      byteStat: 'proportionalResident',
      descriptionPrefix:
          'proportional resident size (PSS) of the native heap in'
    }
  };

  var ALL_PROCESS_NAMES = 'all';

  var LEVEL_OF_DETAIL_NAMES = new Map();
  LEVEL_OF_DETAIL_NAMES.set(LIGHT, 'light');
  LEVEL_OF_DETAIL_NAMES.set(DETAILED, 'detailed');

  var MEMORY_NUMERIC_BUILDER_MAP = new WeakMap();
  // For unitless numerics (process counts), we use 20 linearly scaled bins
  // from 0 to 20.
  MEMORY_NUMERIC_BUILDER_MAP.set(unitlessNumber_smallerIsBetter,
      tr.v.NumericBuilder.createLinear(
          tr.v.Unit.byName.unitlessNumber_smallerIsBetter,
          tr.b.Range.fromExplicitRange(0, 20), 20));
  // For size numerics (subsystem and vm stats), we use 1 bin from 0 B to
  // 1 KiB and 4*24 exponentially scaled bins from 1 KiB to 16 GiB (=2^24 KiB).
  MEMORY_NUMERIC_BUILDER_MAP.set(sizeInBytes_smallerIsBetter,
      new tr.v.NumericBuilder(sizeInBytes_smallerIsBetter, 0)
          .addBinBoundary(1024 /* 1 KiB */)
          .addExponentialBins(16 * 1024 * 1024 * 1024 /* 16 GiB */, 4 * 24));

  function memoryMetric(values, model) {
    var browserNameToGlobalDumps = splitGlobalDumpsByBrowserName(model);
    addGeneralMemoryDumpValues(browserNameToGlobalDumps, values, model);
    addDetailedMemoryDumpValues(browserNameToGlobalDumps, values, model);
    addMemoryDumpCountValues(browserNameToGlobalDumps, values, model);
  }

  /**
   * Splits the global memory dumps in |model| by browser name.
   *
   * @param {!tr.Model} model The trace model from which the global dumps
   *     should be extracted.
   * @return {!Map<string, !Array<!tr.model.GlobalMemoryDump>} A map from
   *     browser names to the associated global memory dumps.
   */
  function splitGlobalDumpsByBrowserName(model) {
    var chromeModelHelper =
        model.getOrCreateHelper(tr.model.helpers.ChromeModelHelper);
    var browserNameToGlobalDumps = new Map();
    var globalDumpToBrowserHelper = new WeakMap();

    // 1. For each browser process in the model, add its global memory dumps to
    // |browserNameToGlobalDumps|. |chromeModelHelper| can be undefined if
    // it fails to find any browser, renderer or GPU process (see
    // tr.model.helpers.ChromeModelHelper.supportsModel).
    if (chromeModelHelper) {
      chromeModelHelper.browserHelpers.forEach(function(helper) {
        // Retrieve the associated global memory dumps and check that they
        // haven't been classified as belonging to another browser process.
        var globalDumps = helper.process.memoryDumps.map(
            d => d.globalMemoryDump);
        globalDumps.forEach(function(globalDump) {
          var existingHelper = globalDumpToBrowserHelper.get(globalDump);
          if (existingHelper !== undefined) {
            throw new Error('Memory dump ID clash across multiple browsers ' +
                'with PIDs: ' + existingHelper.pid + ' and ' + helper.pid);
          }
          globalDumpToBrowserHelper.set(globalDump, helper);
        });

        makeKeyUniqueAndSet(browserNameToGlobalDumps,
            canonicalizeName(helper.browserName), globalDumps);
      });
    }

    // 2. If any global memory dump does not have any associated browser
    // process for some reason, associate it with an 'unknown' browser so that
    // we don't lose the data.
    var unclassifiedGlobalDumps =
        model.globalMemoryDumps.filter(g => !globalDumpToBrowserHelper.has(g));
    if (unclassifiedGlobalDumps.length > 0) {
      makeKeyUniqueAndSet(
          browserNameToGlobalDumps, 'unknown', unclassifiedGlobalDumps);
    }

    return browserNameToGlobalDumps;
  }

  function canonicalizeName(name) {
    return name.toLowerCase().replace(' ', '_');
  };

  var USER_FRIENDLY_BROWSER_NAMES = {
    'chrome': 'Chrome',
    'webview': 'WebView',
    'unknown': 'an unknown browser'
  };

  /**
   * Convert a canonical browser name used in value names to a user-friendly
   * name used in value descriptions.
   *
   * Examples:
   *
   *   CANONICAL BROWSER NAME -> USER-FRIENDLY NAME
   *   chrome                 -> Chrome
   *   unknown                -> an unknown browser
   *   webview2               -> WebView(2)
   *   unexpected             -> 'unexpected' browser
   */
  function convertBrowserNameToUserFriendlyName(browserName) {
    for (var baseName in USER_FRIENDLY_BROWSER_NAMES) {
      if (!browserName.startsWith(baseName))
        continue;
      var userFriendlyBaseName = USER_FRIENDLY_BROWSER_NAMES[baseName];
      var suffix = browserName.substring(baseName.length);
      if (suffix.length === 0)
        return userFriendlyBaseName;
      else if (/^\d+$/.test(suffix))
        return userFriendlyBaseName + '(' + suffix + ')';
    }
    return '\'' + browserName + '\' browser';
  }

  /**
   * Convert a canonical process name used in value names to a plural
   * user-friendly name used in value descriptions.
   *
   * Examples:
   *
   *   CANONICAL PROCESS NAME -> PLURAL USER-FRIENDLY NAME
   *   browser                -> browser processes
   *   renderer               -> renderer processes
   *   all                    -> all processes
   *   gpu_process            -> GPU processes
   *   other                  -> 'other' processes
   */
  function convertProcessNameToPluralUserFriendlyName(processName) {
    switch (processName) {
      case 'browser':
      case 'renderer':
      case ALL_PROCESS_NAMES:
        return processName + ' processes';
      case 'gpu_process':
        return 'GPU processes';
      default:
        return '\'' + processName + '\' processes';
    }
  }

  /**
   * Function for adding entries with duplicate keys to a map without
   * overriding existing entries.
   *
   * This is achieved by appending numeric indices (2, 3, 4, ...) to duplicate
   * keys. Example:
   *
   *   var map = new Map();
   *   // map = Map {}.
   *
   *   makeKeyUniqueAndSet(map, 'key', 'a');
   *   // map = Map {"key" => "a"}.
   *
   *   makeKeyUniqueAndSet(map, 'key', 'b');
   *   // map = Map {"key" => "a", "key2" => "b"}.
   *                                ^^^^
   *   makeKeyUniqueAndSet(map, 'key', 'c');
   *   // map = Map {"key" => "a", "key2" => "b", "key3" => "c"}.
   *                                ^^^^           ^^^^
   */
  function makeKeyUniqueAndSet(map, key, value) {
    var uniqueKey = key;
    var nextIndex = 2;
    while (map.has(uniqueKey)) {
      uniqueKey = key + nextIndex;
      nextIndex++;
    }
    map.set(uniqueKey, value);
  }

  /**
   * Add general memory dump values calculated from all global memory dumps in
   * |model| to |values|. In particular, this function adds the following
   * values:
   *
   *   * PROCESS COUNTS
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:process_count
   *     type: tr.v.Numeric (histogram over all matching global memory dumps)
   *     unit: unitlessNumber_smallerIsBetter
   *
   *   * SUBSYSTEM STATISTICS
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:subsystem:
   *         {v8, malloc, ...}:{effective_size, allocated_objects_size}
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:subsystem:
   *         gpu:android_memtrack:{gl, ...}:memtrack_pss
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:subsystem:
   *         discardable:locked_size
   *     type: tr.v.Numeric (histogram over all matching global memory dumps)
   *     unit: sizeInBytes_smallerIsBetter
   */
  function addGeneralMemoryDumpValues(
      browserNameToGlobalDumps, values, model) {
    addPerProcessNameMemoryDumpValues(browserNameToGlobalDumps,
        gmd => true /* process all global memory dumps */,
        function(processDump, addProcessScalar) {
          // Increment process_count value.
          addProcessScalar(
              'process_count',
              new ScalarNumeric(unitlessNumber_smallerIsBetter, 1),
              'total number of');

          if (processDump.memoryAllocatorDumps === undefined)
            return;

          processDump.memoryAllocatorDumps.forEach(function(rootAllocatorDump) {
            var name = rootAllocatorDump.name;
            var valueNamePrefix = 'subsystem:' + name;

            // Add generic values for each root memory allocator dump
            // (memory:<browser-name>:<process-name>:subsystem:<name>:
            // {effective_size, allocated_objects_size}).
            addProcessScalar(
                valueNamePrefix + ':effective_size',
                rootAllocatorDump.numerics['effective_size'],
                'total effective size of ' + name + ' in');
            addProcessScalar(
                valueNamePrefix + ':allocated_objects_size',
                rootAllocatorDump.numerics['allocated_objects_size'],
                'total size of all objects allocated by ' + name + ' in');

            // Add subsystem-specific values.
            switch (rootAllocatorDump.name) {
              // memory:<browser-name>:<process-name>:subsystem:gpu:
              // android_memtrack:<component-name>:memtrack_pss.
              case 'gpu':
                var memtrackDump =
                    rootAllocatorDump.getDescendantDumpByFullName(
                        'android_memtrack');
                if (memtrackDump !== undefined) {
                  memtrackDump.children.forEach(function(memtrackChildDump) {
                    var childName = memtrackChildDump.name;
                    addProcessScalar(
                        valueNamePrefix + ':android_memtrack:' + childName +
                            ':memtrack_pss',
                        memtrackChildDump.numerics['memtrack_pss'],
                        'total proportional resident size (PSS) of the ' +
                            childName + ' component of Android memtrack in');
                  });
                }
                break;
              // memory:<browser-name>:<process-name>:subsystem:discardable:
              // locked_size.
              case 'discardable':
                addProcessScalar(
                    valueNamePrefix + ':locked_size',
                    rootAllocatorDump.numerics['locked_size'],
                    'total locked (pinned) size of ' + name + ' in');
                break;
            }
          });
        }, values, model);
  }

  /**
   * Add heavy memory dump values calculated from heavy global memory dumps in
   * |model| to |values|. In particular, this function adds the following
   * values:
   *
   *   * VIRTUAL MEMORY STATISTICS
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:vmstats:
   *         {overall, ashmem, native_heap}:pss
   *     memory:{chrome, webview}:{browser, renderer, ..., all}:vmstats:
   *         {overall, java_heap}:private_dirty
   *     type: tr.v.Numeric (histogram over matching heavy global memory dumps)
   *     unit: sizeInBytes_smallerIsBetter
   */
  function addDetailedMemoryDumpValues(
      browserNameToGlobalDumps, values, model) {
    addPerProcessNameMemoryDumpValues(browserNameToGlobalDumps,
        g => g.levelOfDetail === DETAILED,
        function(processDump, addProcessScalar) {
          // Add memory:<browser-name>:<process-name>:vmstats:<name> value for
          // each mmap metric.
          tr.b.iterItems(MMAPS_VALUES, function(valueName, valueSpec) {
            var node = getDescendantVmRegionClassificationNode(
                processDump.vmRegions, valueSpec.path);
            var value = node ? (node.byteStats[valueSpec.byteStat] || 0) : 0;
            addProcessScalar(
                'vmstats:' + valueName,
                new ScalarNumeric(sizeInBytes_smallerIsBetter, value),
                valueSpec.descriptionPrefix);
          });

          // Add memory:<browser-name>:<process-name>:subsystem:v8:
          // code_and_metadata_size when available.
          var v8Dump = processDump.getMemoryAllocatorDumpByFullName('v8');
          if (v8Dump !== undefined) {
            var CODE_SIZE_METRIC = 'subsystem:v8:code_and_metadata_size';
            // V8 generates bytecode when interpreting and code objects when
            // compiling the javascript. Total code size includes the size
            // of code and bytecode objects.
            addProcessScalar(
                CODE_SIZE_METRIC,
                v8Dump.numerics['code_and_metadata_size']);
            addProcessScalar(
                CODE_SIZE_METRIC,
                v8Dump.numerics['bytecode_and_metadata_size']);
          }

        }, values, model);
  }

  /**
   * Get the descendant of a VM region classification |node| specified by the
   * given |path| of child node titles. If |node| is undefined or such a
   * descendant does not exist, this function returns undefined.
   */
  function getDescendantVmRegionClassificationNode(node, path) {
    for (var i = 0; i < path.length; i++) {
      if (node === undefined)
        break;
      node = tr.b.findFirstInArray(node.children, c => c.title === path[i]);
    }
    return node;
  }

  /**
   * Add global memory dump counts in |model| to |values|. In particular,
   * this function adds the following values:
   *
   *   * DUMP COUNTS
   *     memory:{chrome, webview}:all:dump_count:{light, detailed, total}
   *     type: tr.v.ScalarNumeric (scalar over the whole trace)
   *     unit: unitlessNumber_smallerIsBetter
   *
   * Note that unlike all other values generated by the memory metric, the
   * global memory dump counts are NOT instances of tr.v.Numeric (histogram)
   * because it doesn't make sense to aggregate them (they are already counts
   * over all global dumps associated with the relevant browser).
   */
  function addMemoryDumpCountValues(
      browserNameToGlobalDumps, values, model) {
    browserNameToGlobalDumps.forEach(function(globalDumps, browserName) {
      var levelOfDetailNameToDumpCount = { 'total': 0 };
      LEVEL_OF_DETAIL_NAMES.forEach(function(levelOfDetailName) {
        levelOfDetailNameToDumpCount[levelOfDetailName] = 0;
      });

      globalDumps.forEach(function(globalDump) {
        // Increment the total dump count.
        levelOfDetailNameToDumpCount.total++;

        // Increment the level-of-detail-specific dump count (if possible).
        var levelOfDetailName =
            LEVEL_OF_DETAIL_NAMES.get(globalDump.levelOfDetail);
        if (!(levelOfDetailName in levelOfDetailNameToDumpCount))
          return;  // Unknown level of detail.
        levelOfDetailNameToDumpCount[levelOfDetailName]++;
      });

      // Add memory:<browser-name>:dump_count:<level> value for each level of
      // detail (and total).
      var browserUserFriendlyName =
          convertBrowserNameToUserFriendlyName(browserName);
      tr.b.iterItems(levelOfDetailNameToDumpCount,
          function(levelOfDetailName, levelOfDetailDumpCount) {
            var description = [
              'total number of',
              levelOfDetailName === 'total' ? 'all' : levelOfDetailName,
              'memory dumps added by',
              browserUserFriendlyName,
              'to the trace'
            ].join(' ');
            values.addValue(new tr.v.NumericValue(
                ['memory', browserName, ALL_PROCESS_NAMES, 'dump_count',
                    levelOfDetailName].join(':'),
                new ScalarNumeric(
                    unitlessNumber_smallerIsBetter, levelOfDetailDumpCount),
                { description: description }));
          });
    });
  }

  /**
   * Add generic values extracted from process memory dumps and aggregated by
   * browser and process name into |values|.
   *
   * For each browser and set of global dumps in |browserNameToGlobalDumps|,
   * |customProcessDumpValueExtractor| is applied to every process memory dump
   * associated with the global memory dump. The second argument provided to the
   * callback is a function for adding extracted values:
   *
   *   function sampleProcessDumpCallback(processDump, addProcessValue) {
   *     ...
   *     addProcessValue('value_name_1', valueExtractedFromProcessDump1);
   *     ...
   *     addProcessValue('value_name_2', valueExtractedFromProcessDump2);
   *     ...
   *   }
   *
   * For each global memory dump, the extracted values are summed by process
   * name (browser, renderer, ..., all). The sums are then aggregated over all
   * global memory dumps associated with the given browser. For example,
   * assuming that |customProcessDumpValueExtractor| extracts a value called
   * 'x' from each process memory dump, the following values will be reported:
   *
   *    memory:<browser-name>:browser:x : tr.v.Numeric aggregated over [
   *      sum of 'x' in all 'browser' process dumps in global dump 1,
   *      sum of 'x' in all 'browser' process dumps in global dump 2,
   *      ...
   *      sum of 'x' in all 'browser' process dumps in global dump N
   *    ]
   *
   *    memory:<browser-name>:renderer:x : tr.v.Numeric aggregated over [
   *      sum of 'x' in all 'renderer' process dumps in global dump 1,
   *      sum of 'x' in all 'renderer' process dumps in global dump 2,
   *      ...
   *      sum of 'x' in all 'renderer' process dumps in global dump N
   *    ]
   *
   *    ...
   *
   *    memory:<browser-name>:all:x : tr.v.Numeric aggregated over [
   *      sum of 'x' in all process dumps in global dump 1,
   *      sum of 'x' in all process dumps in global dump 2,
   *      ...
   *      sum of 'x' in all process dumps in global dump N,
   *    ]
   *
   * where global dumps 1 to N are the global dumps associated with the given
   * browser.
   *
   * @param {!Map<string, !Array<!tr.model.GlobalMemoryDump>}
   *     browserNameToGlobalDumps Map from browser names to arrays of global
   *     memory dumps. The generic values will be extracted from the associated
   *     process memory dumps.
   * @param {!function(!tr.model.GlobalMemoryDump): boolean}
   *     customGlobalDumpFilter Predicate for filtering global memory dumps.
   * @param {!function(
   *     !tr.model.ProcessMemoryDump,
   *     !function(string, !tr.v.ScalarNumeric))}
   *     customProcessDumpValueExtractor Callback for extracting values from a
   *     process memory dump.
   * @param {!tr.metrics.ValueSet} values List of values to which the
   *     resulting aggregated values are added.
   * @param {!tr.Model} model The underlying trace model.
   */
  function addPerProcessNameMemoryDumpValues(
      browserNameToGlobalDumps, customGlobalDumpFilter,
      customProcessDumpValueExtractor, values, model) {
    browserNameToGlobalDumps.forEach(function(globalDumps, browserName) {
      var filteredGlobalDumps = globalDumps.filter(customGlobalDumpFilter);

      // Value name -> {unit: tr.v.Unit, descriptionPrefix: string}.
      var valueNameToSpec = {};

      // Global memory dump timestamp (list index) -> Process name ->
      // Value name -> number.
      var timeToProcessNameToValueNameToSum =
          calculatePerProcessNameMemoryDumpValues(filteredGlobalDumps,
              valueNameToSpec, customProcessDumpValueExtractor);

      injectTotalsIntoPerProcessNameMemoryDumpValues(
          timeToProcessNameToValueNameToSum);
      reportPerProcessNameMemoryDumpValues(timeToProcessNameToValueNameToSum,
          valueNameToSpec, browserName, values, model);
    });
  }

  /**
   * For each global memory dump in |globalDumps|, calculate per-process-name
   * sums of values extracted by |customProcessDumpValueExtractor| from the
   * associated process memory dumps.
   *
   * This function returns the following list of nested maps:
   *
   *   Global memory dump timestamp (list index)
   *     -> Process name (dict with keys 'browser', 'renderer', ...)
   *          -> Value name (dict with keys 'subsystem:v8', ...)
   *               -> Sum of value over the processes (number).
   *
   * and updates the |valueNameToSpec| argument to be a map from the names of
   * the extracted values to specifications:
   *
   *   Value name (dict with keys 'subsystem:v8', ...)
   *     -> { unit: tr.v.Unit, descriptionPrefix: string }.
   *
   * See addPerProcessNameMemoryDumpValues for more details.
   */
  function calculatePerProcessNameMemoryDumpValues(
      globalDumps, valueNameToSpec, customProcessDumpValueExtractor) {
    return globalDumps.map(function(globalDump) {
      // Process name -> Value name -> Sum over processes.
      var processNameToValueNameToSum = {};

      tr.b.iterItems(globalDump.processMemoryDumps, function(_, processDump) {
        // Process name is typically 'browser', 'renderer', etc.
        var rawProcessName = processDump.process.name || 'unknown';
        var processName = canonicalizeName(rawProcessName);

        // Value name -> Sum over processes.
        var valueNameToSum = processNameToValueNameToSum[processName];
        if (valueNameToSum === undefined)
          processNameToValueNameToSum[processName] = valueNameToSum = {};

        customProcessDumpValueExtractor(
            processDump,
            function addProcessScalar(
                name, processDumpScalar, descriptionPrefix) {
              if (processDumpScalar === undefined)
                return;
              var valueSpec = valueNameToSpec[name];
              if (valueSpec === undefined) {
                valueNameToSpec[name] = valueSpec = {
                  unit: processDumpScalar.unit,
                  descriptionPrefix: descriptionPrefix
                };
              } else {
                if (processDumpScalar.unit !== valueSpec.unit) {
                  throw new Error('Multiple units provided for value \'' +
                      name + '\': ' + valueSpec.unit.unitName + ' and ' +
                      processDumpScalar.unit.unitName);
                }
                if (descriptionPrefix !== valueSpec.descriptionPrefix) {
                  throw new Error('Multiple description prefixes provided ' +
                      'for value \'' + name + '\': \'' +
                      valueSpec.descriptionPrefix + '\' and \'' +
                      descriptionPrefix + '\'');
                }
              }
              valueNameToSum[name] = (valueNameToSum[name] || 0) +
                  processDumpScalar.value;
            });
      });
      return processNameToValueNameToSum;
    });
  }

  /**
   * For each timestamp (corresponding to a global memory dump) in
   * |timeToProcessNameToValueNameToSum|, sum per-process-name sums into total
   * sums over all process names.
   *
   * See addPerProcessNameMemoryDumpValues for more details.
   */
  function injectTotalsIntoPerProcessNameMemoryDumpValues(
      timeToProcessNameToValueNameToSum) {
    timeToProcessNameToValueNameToSum.forEach(
        function(processNameToValueNameToSum) {
          var valueNameToProcessNameToSum = tr.b.invertArrayOfDicts(
              tr.b.dictionaryValues(processNameToValueNameToSum));
          processNameToValueNameToSum[ALL_PROCESS_NAMES] = tr.b.mapItems(
              valueNameToProcessNameToSum,
              function(valueName, perProcessSums) {
                return perProcessSums.reduce((acc, sum) => acc + sum, 0);
              });
        });
  }

  /**
   * For each process name (plus total over 'all' process names) and value
   * name, add a tr.v.Numeric aggregating the associated values across all
   * timestamps (corresponding to global memory dumps associated with the given
   * browser) in |timeToProcessNameToValueNameToSum| to |values|.
   *
   * See addPerProcessNameMemoryDumpValues for more details.
   */
  function reportPerProcessNameMemoryDumpValues(
      timeToProcessNameToValueNameToSum, valueNameToSpec, browserName, values,
      model) {
    var browserUserFriendlyName =
        convertBrowserNameToUserFriendlyName(browserName);
    var processNameToTimeToValueNameToSum =
        tr.b.invertArrayOfDicts(timeToProcessNameToValueNameToSum);
    tr.b.iterItems(
        processNameToTimeToValueNameToSum,
        function(processName, timeToValueNameToSum) {
          var processPluralUserFriendlyName =
              convertProcessNameToPluralUserFriendlyName(processName);
          var valueNameToTimeToSum =
              tr.b.invertArrayOfDicts(timeToValueNameToSum);
          tr.b.iterItems(
              valueNameToTimeToSum,
              function(valueName, timeToSum) {
                var valueSpec = valueNameToSpec[valueName];
                var description = [
                  valueSpec.descriptionPrefix,
                  processPluralUserFriendlyName,
                  'in',
                  browserUserFriendlyName
                ].join(' ');
                values.addValue(new tr.v.NumericValue(
                    ['memory', browserName, processName, valueName].join(':'),
                    buildMemoryNumeric(timeToSum, valueSpec.unit),
                    { description: description }));
              });
        });
  }

  /**
   * Create a memory tr.v.Numeric (histogram) for |unit| and add all |sums| to
   * it.
   *
   * Undefined items in |sums| are treated as zeros.
   */
  function buildMemoryNumeric(sums, unit) {
    var numeric = MEMORY_NUMERIC_BUILDER_MAP.get(unit).build();
    for (var i = 0; i < sums.length; i++)
      numeric.add(sums[i] || 0);
    return numeric;
  }

  tr.metrics.MetricRegistry.register(memoryMetric);

  return {
    memoryMetric: memoryMetric
  };
});
