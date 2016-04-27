/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * Stubbery to allow portions of the DevTools frontend to be used in lighthouse. `WebInspector`
 * technically lives on the global object but should be accessed through a normal `require` call.
 */

// Global pollution.
global.self = global;
if (typeof global.window === 'undefined') {
  global.window = global;
}

global.Runtime = {};
global.Runtime.experiments = {
  isEnabled(experimentName) {
    switch (experimentName) {
      case 'timelineLatencyInfo':
        return true;
      default:
        return false;
    }
  }
};

global.TreeElement = {};
global.WorkerRuntime = {};
const InspectorBackendClass = global.InspectorBackendClass = function () { };

global.Protocol = {
  Agents() {}
};

global.WebInspector = {};
const WebInspector = global.WebInspector;
WebInspector._moduleSettings = {
  cacheDisabled: {
    addChangeListener() {},
    get() {
      return false;
    }
  },
  monitoringXHREnabled: {
    addChangeListener() {},
    get() {
      return false;
    }
  },
  showNativeFunctionsInJSProfile: {
    addChangeListener() {},
    get() {
      return true;
    }
  }
};
WebInspector.moduleSetting = function(settingName) {
  return this._moduleSettings[settingName];
};

global.insertionIndexForObjectInListSortedByFunction =
    function(object, list, comparator, insertionIndexAfter) {
      if (insertionIndexAfter) {
        return list.upperBound(object, comparator);
      }

      return list.lowerBound(object, comparator);
    };

// Enum from chromium//src/third_party/WebKit/Source/core/loader/MixedContentChecker.h
global.NetworkAgent = {
  RequestMixedContentType: {
    Blockable: 'blockable',
    OptionallyBlockable: 'optionally-blockable',
    None: 'none'
  },
  BlockedReason: {
    CSP: 'csp',
    MixedContent: 'mixed-content',
    Origin: 'origin',
    Inspector: 'inspector',
    Other: 'other'
  }
};
// Enum from SecurityState enum in protocol's Security domain
global.SecurityAgent = {
  SecurityState: {
    Unknown: 'unknown',
    Neutral: 'neutral',
    Insecure: 'insecure',
    Warning: 'warning',
    Secure: 'secure',
    Info: 'info'
  }
};
// From https://chromium.googlesource.com/chromium/src/third_party/WebKit/Source/devtools/+/master/protocol.json#93
global.PageAgent = {
  ResourceType: {
    Document: 'document',
    Stylesheet: 'stylesheet',
    Image: 'image',
    Media: 'media',
    Font: 'font',
    Script: 'script',
    TextTrack: 'texttrack',
    XHR: 'xhr',
    Fetch: 'fetch',
    EventSource: 'eventsource',
    WebSocket: 'websocket',
    Manifest: 'manifest',
    Other: 'other'
  }
};
// Dependencies for network-recorder
require('chrome-devtools-frontend/front_end/common/Object.js');
require('chrome-devtools-frontend/front_end/common/ParsedURL.js');
require('chrome-devtools-frontend/front_end/common/ResourceType.js');
require('chrome-devtools-frontend/front_end/common/UIString.js');
require('chrome-devtools-frontend/front_end/platform/utilities.js');
require('chrome-devtools-frontend/front_end/sdk/Target.js');
require('chrome-devtools-frontend/front_end/sdk/NetworkManager.js');
require('chrome-devtools-frontend/front_end/sdk/NetworkRequest.js');

// Deps for service-worker manager

require('chrome-devtools-frontend/front_end/sdk/TargetManager.js');
require('chrome-devtools-frontend/front_end/host/InspectorFrontendHostAPI.js');
require('chrome-devtools-frontend/front_end/sdk/InspectorBackend.js');
require('chrome-devtools-frontend/front_end/sdk/ResourceTreeModel.js');
require('chrome-devtools-frontend/front_end/sdk/ServiceWorkerManager.js');
require('chrome-devtools-frontend/front_end/main/Connections.js');

global.InspectorFrontendHost = new InspectorFrontendHostAPI();
InspectorFrontendHost.events = new WebInspector.Object();

global.location = {
  toString: (_ => 'http://localhost:9222/devtools/inspector.html?ws=localhost:9222'),
  origin: 'localhost'
};
require('chrome-devtools-frontend/front_end/Runtime.js');

var targetType = WebInspector.Target.Type.Page; // WebInspector.Target.Type.ServiceWorker
console.error('hi', InspectorBackendClass)
var connection = new WebInspector.MainConnection();
var target = WebInspector.targetManager.createTarget(WebInspector.UIString("Main"), targetType, connection, null);

// Dependencies for timeline-model
// WebInspector.targetManager = {
//   observeTargets() {}
// };
WebInspector.settings = {
  createSetting() {}
};
WebInspector.console = {
  error() {}
};
WebInspector.VBox = function() {};
WebInspector.HBox = function() {};
WebInspector.ViewportDataGrid = function() {};
WebInspector.ViewportDataGridNode = function() {};
global.WorkerRuntime.Worker = function() {};

require('chrome-devtools-frontend/front_end/common/SegmentedRange.js');
require('chrome-devtools-frontend/front_end/bindings/TempFile.js');
require('chrome-devtools-frontend/front_end/sdk/TracingModel.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineJSProfile.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
require('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
require('chrome-devtools-frontend/front_end/timeline/LayerTreeModel.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineModel.js');
require('chrome-devtools-frontend/front_end/ui_lazy/SortableDataGrid.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineProfileTree.js');
require('chrome-devtools-frontend/front_end/components_lazy/FilmStripModel.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineIRModel.js');
require('chrome-devtools-frontend/front_end/timeline/TimelineFrameModel.js');

// DevTools makes a few assumptions about using backing storage to hold traces.
WebInspector.DeferredTempFile = function() {};
WebInspector.DeferredTempFile.prototype = {
  write: function() {},
  finishWriting: function() {}
};

// Dependencies for color parsing.
require('chrome-devtools-frontend/front_end/common/Color.js');

// Mocked-up WebInspector Target for NetworkManager
const fakeNetworkAgent = {
  enable() {}
};
const fakeServiceWorkerAgent = {
  enable() {}
};
const fakeTarget = {
  _modelByConstructor: new Map(),
  networkAgent() {
    return fakeNetworkAgent;
  },
  serviceWorkerAgent() {
    return fakeServiceWorkerAgent;
  },
  registerNetworkDispatcher() { },
  registerServiceWorkerDispatcher(swDsptchr) {
    swDsptchr._manager._dispatcher = swDsptchr;
  }
};

/**
 * Creates a new WebInspector NetworkManager using a mocked Target.
 * @return {!WebInspector.NetworkManager}
 */
WebInspector.NetworkManager.createWithFakeTarget = function() {
  return new WebInspector.NetworkManager(fakeTarget);
};

WebInspector.ServiceWorkerManager.createWithFakeTarget = function() {
  return new WebInspector.ServiceWorkerManager(fakeTarget);
};

// WebInspector.TargetManager = {
//   Events: {
//     MainFrameNavigated: 'MainFrameNavigated'
//   },
//   addEventListener: function() { }
// };
// WebInspector.targetManager = WebInspector.TargetManager;

global.ServiceWorkerAgent = {
  ServiceWorkerVersionRunningStatus: ["stopped", "starting", "running", "stopping"],
  ServiceWorkerVersionStatus: ["new", "installing", "installed", "activating", "activated", "redundant"]
};

module.exports = WebInspector;
