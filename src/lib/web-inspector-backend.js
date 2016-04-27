

InspectorBackend.registerEvent("Inspector.detached", ["reason"]);
InspectorBackend.registerEvent("Inspector.targetCrashed", []);
InspectorBackend.registerCommand("Inspector.enable", [], [], false);
InspectorBackend.registerCommand("Inspector.disable", [], [], false);
InspectorBackend.registerEnum("Memory.PressureLevel", {
    Moderate: "moderate",
    Critical: "critical"
});
InspectorBackend.registerCommand("Memory.getDOMCounters", [], ["documents", "nodes", "jsEventListeners"], false);
InspectorBackend.registerCommand("Memory.setPressureNotificationsSuppressed", [{
    "name": "suppressed",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Memory.simulatePressureNotification", [{
    "name": "level",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("Page.ResourceType", {
    Document: "Document",
    Stylesheet: "Stylesheet",
    Image: "Image",
    Media: "Media",
    Font: "Font",
    Script: "Script",
    TextTrack: "TextTrack",
    XHR: "XHR",
    Fetch: "Fetch",
    EventSource: "EventSource",
    WebSocket: "WebSocket",
    Manifest: "Manifest",
    Other: "Other"
});
InspectorBackend.registerEnum("Page.DialogType", {
    Alert: "alert",
    Confirm: "confirm",
    Prompt: "prompt",
    Beforeunload: "beforeunload"
});
InspectorBackend.registerEvent("Page.domContentEventFired", ["timestamp"]);
InspectorBackend.registerEvent("Page.loadEventFired", ["timestamp"]);
InspectorBackend.registerEvent("Page.frameAttached", ["frameId", "parentFrameId"]);
InspectorBackend.registerEvent("Page.frameNavigated", ["frame"]);
InspectorBackend.registerEvent("Page.frameDetached", ["frameId"]);
InspectorBackend.registerEvent("Page.frameStartedLoading", ["frameId"]);
InspectorBackend.registerEvent("Page.frameStoppedLoading", ["frameId"]);
InspectorBackend.registerEvent("Page.frameScheduledNavigation", ["frameId", "delay"]);
InspectorBackend.registerEvent("Page.frameClearedScheduledNavigation", ["frameId"]);
InspectorBackend.registerEvent("Page.frameResized", []);
InspectorBackend.registerEvent("Page.javascriptDialogOpening", ["message", "type"]);
InspectorBackend.registerEvent("Page.javascriptDialogClosed", ["result"]);
InspectorBackend.registerEvent("Page.screencastFrame", ["data", "metadata", "sessionId"]);
InspectorBackend.registerEvent("Page.screencastVisibilityChanged", ["visible"]);
InspectorBackend.registerEvent("Page.colorPicked", ["color"]);
InspectorBackend.registerEvent("Page.interstitialShown", []);
InspectorBackend.registerEvent("Page.interstitialHidden", []);
InspectorBackend.registerCommand("Page.enable", [], [], false);
InspectorBackend.registerCommand("Page.disable", [], [], false);
InspectorBackend.registerCommand("Page.addScriptToEvaluateOnLoad", [{
    "name": "scriptSource",
    "type": "string",
    "optional": false
}], ["identifier"], false);
InspectorBackend.registerCommand("Page.removeScriptToEvaluateOnLoad", [{
    "name": "identifier",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.setAutoAttachToCreatedPages", [{
    "name": "autoAttach",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.reload", [{
    "name": "ignoreCache",
    "type": "boolean",
    "optional": true
}, {
    "name": "scriptToEvaluateOnLoad",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.navigate", [{
    "name": "url",
    "type": "string",
    "optional": false
}], ["frameId"], false);
InspectorBackend.registerCommand("Page.getNavigationHistory", [], ["currentIndex", "entries"], false);
InspectorBackend.registerCommand("Page.navigateToHistoryEntry", [{
    "name": "entryId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.getCookies", [], ["cookies"], false);
InspectorBackend.registerCommand("Page.deleteCookie", [{
    "name": "cookieName",
    "type": "string",
    "optional": false
}, {
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.getResourceTree", [], ["frameTree"], false);
InspectorBackend.registerCommand("Page.getResourceContent", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}, {
    "name": "url",
    "type": "string",
    "optional": false
}], ["content", "base64Encoded"], false);
InspectorBackend.registerCommand("Page.searchInResource", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}, {
    "name": "url",
    "type": "string",
    "optional": false
}, {
    "name": "query",
    "type": "string",
    "optional": false
}, {
    "name": "caseSensitive",
    "type": "boolean",
    "optional": true
}, {
    "name": "isRegex",
    "type": "boolean",
    "optional": true
}], ["result"], false);
InspectorBackend.registerCommand("Page.setDocumentContent", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}, {
    "name": "html",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.setDeviceMetricsOverride", [{
    "name": "width",
    "type": "number",
    "optional": false
}, {
    "name": "height",
    "type": "number",
    "optional": false
}, {
    "name": "deviceScaleFactor",
    "type": "number",
    "optional": false
}, {
    "name": "mobile",
    "type": "boolean",
    "optional": false
}, {
    "name": "fitWindow",
    "type": "boolean",
    "optional": false
}, {
    "name": "scale",
    "type": "number",
    "optional": true
}, {
    "name": "offsetX",
    "type": "number",
    "optional": true
}, {
    "name": "offsetY",
    "type": "number",
    "optional": true
}, {
    "name": "screenWidth",
    "type": "number",
    "optional": true
}, {
    "name": "screenHeight",
    "type": "number",
    "optional": true
}, {
    "name": "positionX",
    "type": "number",
    "optional": true
}, {
    "name": "positionY",
    "type": "number",
    "optional": true
}, {
    "name": "screenOrientation",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.clearDeviceMetricsOverride", [], [], false);
InspectorBackend.registerCommand("Page.setGeolocationOverride", [{
    "name": "latitude",
    "type": "number",
    "optional": true
}, {
    "name": "longitude",
    "type": "number",
    "optional": true
}, {
    "name": "accuracy",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.clearGeolocationOverride", [], [], false);
InspectorBackend.registerCommand("Page.setDeviceOrientationOverride", [{
    "name": "alpha",
    "type": "number",
    "optional": false
}, {
    "name": "beta",
    "type": "number",
    "optional": false
}, {
    "name": "gamma",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.clearDeviceOrientationOverride", [], [], false);
InspectorBackend.registerCommand("Page.setTouchEmulationEnabled", [{
    "name": "enabled",
    "type": "boolean",
    "optional": false
}, {
    "name": "configuration",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.captureScreenshot", [], ["data"], false);
InspectorBackend.registerCommand("Page.startScreencast", [{
    "name": "format",
    "type": "string",
    "optional": true
}, {
    "name": "quality",
    "type": "number",
    "optional": true
}, {
    "name": "maxWidth",
    "type": "number",
    "optional": true
}, {
    "name": "maxHeight",
    "type": "number",
    "optional": true
}, {
    "name": "everyNthFrame",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.stopScreencast", [], [], false);
InspectorBackend.registerCommand("Page.screencastFrameAck", [{
    "name": "sessionId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.handleJavaScriptDialog", [{
    "name": "accept",
    "type": "boolean",
    "optional": false
}, {
    "name": "promptText",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.setColorPickerEnabled", [{
    "name": "enabled",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Page.setOverlayMessage", [{
    "name": "message",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Page.requestAppBanner", [], [], false);
InspectorBackend.registerCommand("Rendering.setShowPaintRects", [{
    "name": "result",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Rendering.setShowDebugBorders", [{
    "name": "show",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Rendering.setShowFPSCounter", [{
    "name": "show",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Rendering.setShowScrollBottleneckRects", [{
    "name": "show",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Rendering.setShowViewportSizeOnResize", [{
    "name": "show",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("Emulation.ScreenOrientationType", {
    PortraitPrimary: "portraitPrimary",
    PortraitSecondary: "portraitSecondary",
    LandscapePrimary: "landscapePrimary",
    LandscapeSecondary: "landscapeSecondary"
});
InspectorBackend.registerCommand("Emulation.setDeviceMetricsOverride", [{
    "name": "width",
    "type": "number",
    "optional": false
}, {
    "name": "height",
    "type": "number",
    "optional": false
}, {
    "name": "deviceScaleFactor",
    "type": "number",
    "optional": false
}, {
    "name": "mobile",
    "type": "boolean",
    "optional": false
}, {
    "name": "fitWindow",
    "type": "boolean",
    "optional": false
}, {
    "name": "scale",
    "type": "number",
    "optional": true
}, {
    "name": "offsetX",
    "type": "number",
    "optional": true
}, {
    "name": "offsetY",
    "type": "number",
    "optional": true
}, {
    "name": "screenWidth",
    "type": "number",
    "optional": true
}, {
    "name": "screenHeight",
    "type": "number",
    "optional": true
}, {
    "name": "positionX",
    "type": "number",
    "optional": true
}, {
    "name": "positionY",
    "type": "number",
    "optional": true
}, {
    "name": "screenOrientation",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Emulation.clearDeviceMetricsOverride", [], [], false);
InspectorBackend.registerCommand("Emulation.resetPageScaleFactor", [], [], false);
InspectorBackend.registerCommand("Emulation.setPageScaleFactor", [{
    "name": "pageScaleFactor",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Emulation.setScriptExecutionDisabled", [{
    "name": "value",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Emulation.setGeolocationOverride", [{
    "name": "latitude",
    "type": "number",
    "optional": true
}, {
    "name": "longitude",
    "type": "number",
    "optional": true
}, {
    "name": "accuracy",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Emulation.clearGeolocationOverride", [], [], false);
InspectorBackend.registerCommand("Emulation.setTouchEmulationEnabled", [{
    "name": "enabled",
    "type": "boolean",
    "optional": false
}, {
    "name": "configuration",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Emulation.setEmulatedMedia", [{
    "name": "media",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Emulation.setCPUThrottlingRate", [{
    "name": "rate",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Emulation.canEmulate", [], ["result"], false);
InspectorBackend.registerEnum("Runtime.RemoteObjectType", {
    Object: "object",
    Function: "function",
    Undefined: "undefined",
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Symbol: "symbol"
});
InspectorBackend.registerEnum("Runtime.RemoteObjectSubtype", {
    Array: "array",
    Null: "null",
    Node: "node",
    Regexp: "regexp",
    Date: "date",
    Map: "map",
    Set: "set",
    Iterator: "iterator",
    Generator: "generator",
    Error: "error"
});
InspectorBackend.registerEnum("Runtime.ObjectPreviewType", {
    Object: "object",
    Function: "function",
    Undefined: "undefined",
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Symbol: "symbol"
});
InspectorBackend.registerEnum("Runtime.ObjectPreviewSubtype", {
    Array: "array",
    Null: "null",
    Node: "node",
    Regexp: "regexp",
    Date: "date",
    Map: "map",
    Set: "set",
    Iterator: "iterator",
    Generator: "generator",
    Error: "error"
});
InspectorBackend.registerEnum("Runtime.PropertyPreviewType", {
    Object: "object",
    Function: "function",
    Undefined: "undefined",
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Symbol: "symbol",
    Accessor: "accessor"
});
InspectorBackend.registerEnum("Runtime.PropertyPreviewSubtype", {
    Array: "array",
    Null: "null",
    Node: "node",
    Regexp: "regexp",
    Date: "date",
    Map: "map",
    Set: "set",
    Iterator: "iterator",
    Generator: "generator",
    Error: "error"
});
InspectorBackend.registerEnum("Runtime.CallArgumentType", {
    Object: "object",
    Function: "function",
    Undefined: "undefined",
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Symbol: "symbol"
});
InspectorBackend.registerEvent("Runtime.executionContextCreated", ["context"]);
InspectorBackend.registerEvent("Runtime.executionContextDestroyed", ["executionContextId"]);
InspectorBackend.registerEvent("Runtime.executionContextsCleared", []);
InspectorBackend.registerEvent("Runtime.inspectRequested", ["object", "hints"]);
InspectorBackend.registerCommand("Runtime.evaluate", [{
    "name": "expression",
    "type": "string",
    "optional": false
}, {
    "name": "objectGroup",
    "type": "string",
    "optional": true
}, {
    "name": "includeCommandLineAPI",
    "type": "boolean",
    "optional": true
}, {
    "name": "doNotPauseOnExceptionsAndMuteConsole",
    "type": "boolean",
    "optional": true
}, {
    "name": "contextId",
    "type": "number",
    "optional": true
}, {
    "name": "returnByValue",
    "type": "boolean",
    "optional": true
}, {
    "name": "generatePreview",
    "type": "boolean",
    "optional": true
}, {
    "name": "userGesture",
    "type": "boolean",
    "optional": true
}], ["result", "wasThrown", "exceptionDetails"], false);
InspectorBackend.registerCommand("Runtime.callFunctionOn", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}, {
    "name": "functionDeclaration",
    "type": "string",
    "optional": false
}, {
    "name": "arguments",
    "type": "object",
    "optional": true
}, {
    "name": "doNotPauseOnExceptionsAndMuteConsole",
    "type": "boolean",
    "optional": true
}, {
    "name": "returnByValue",
    "type": "boolean",
    "optional": true
}, {
    "name": "generatePreview",
    "type": "boolean",
    "optional": true
}, {
    "name": "userGesture",
    "type": "boolean",
    "optional": true
}], ["result", "wasThrown"], false);
InspectorBackend.registerCommand("Runtime.getProperties", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}, {
    "name": "ownProperties",
    "type": "boolean",
    "optional": true
}, {
    "name": "accessorPropertiesOnly",
    "type": "boolean",
    "optional": true
}, {
    "name": "generatePreview",
    "type": "boolean",
    "optional": true
}], ["result", "internalProperties", "exceptionDetails"], false);
InspectorBackend.registerCommand("Runtime.releaseObject", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Runtime.releaseObjectGroup", [{
    "name": "objectGroup",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Runtime.run", [], [], false);
InspectorBackend.registerCommand("Runtime.enable", [], [], false);
InspectorBackend.registerCommand("Runtime.disable", [], [], false);
InspectorBackend.registerCommand("Runtime.setCustomObjectFormatterEnabled", [{
    "name": "enabled",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Runtime.compileScript", [{
    "name": "expression",
    "type": "string",
    "optional": false
}, {
    "name": "sourceURL",
    "type": "string",
    "optional": false
}, {
    "name": "persistScript",
    "type": "boolean",
    "optional": false
}, {
    "name": "executionContextId",
    "type": "number",
    "optional": false
}], ["scriptId", "exceptionDetails"], false);
InspectorBackend.registerCommand("Runtime.runScript", [{
    "name": "scriptId",
    "type": "string",
    "optional": false
}, {
    "name": "executionContextId",
    "type": "number",
    "optional": false
}, {
    "name": "objectGroup",
    "type": "string",
    "optional": true
}, {
    "name": "doNotPauseOnExceptionsAndMuteConsole",
    "type": "boolean",
    "optional": true
}, {
    "name": "includeCommandLineAPI",
    "type": "boolean",
    "optional": true
}], ["result", "exceptionDetails"], false);
InspectorBackend.registerEnum("Console.ConsoleMessageSource", {
    XML: "xml",
    Javascript: "javascript",
    Network: "network",
    ConsoleAPI: "console-api",
    Storage: "storage",
    Appcache: "appcache",
    Rendering: "rendering",
    Security: "security",
    Other: "other",
    Deprecation: "deprecation"
});
InspectorBackend.registerEnum("Console.ConsoleMessageLevel", {
    Log: "log",
    Warning: "warning",
    Error: "error",
    Debug: "debug",
    Info: "info",
    RevokedError: "revokedError"
});
InspectorBackend.registerEnum("Console.ConsoleMessageType", {
    Log: "log",
    Dir: "dir",
    DirXML: "dirxml",
    Table: "table",
    Trace: "trace",
    Clear: "clear",
    StartGroup: "startGroup",
    StartGroupCollapsed: "startGroupCollapsed",
    EndGroup: "endGroup",
    Assert: "assert",
    Profile: "profile",
    ProfileEnd: "profileEnd"
});
InspectorBackend.registerEvent("Console.messageAdded", ["message"]);
InspectorBackend.registerEvent("Console.messageRepeatCountUpdated", ["count", "timestamp"]);
InspectorBackend.registerEvent("Console.messagesCleared", []);
InspectorBackend.registerCommand("Console.enable", [], [], false);
InspectorBackend.registerCommand("Console.disable", [], [], false);
InspectorBackend.registerCommand("Console.clearMessages", [], [], false);
InspectorBackend.registerEnum("Security.SecurityState", {
    Unknown: "unknown",
    Neutral: "neutral",
    Insecure: "insecure",
    Warning: "warning",
    Secure: "secure",
    Info: "info"
});
InspectorBackend.registerEvent("Security.securityStateChanged", ["securityState", "explanations", "mixedContentStatus", "schemeIsCryptographic"]);
InspectorBackend.registerCommand("Security.enable", [], [], false);
InspectorBackend.registerCommand("Security.disable", [], [], false);
InspectorBackend.registerEnum("Network.ResourcePriority", {
    VeryLow: "VeryLow",
    Low: "Low",
    Medium: "Medium",
    High: "High",
    VeryHigh: "VeryHigh"
});
InspectorBackend.registerEnum("Network.RequestMixedContentType", {
    Blockable: "blockable",
    OptionallyBlockable: "optionally-blockable",
    None: "none"
});
InspectorBackend.registerEnum("Network.BlockedReason", {
    Csp: "csp",
    MixedContent: "mixed-content",
    Origin: "origin",
    Inspector: "inspector",
    Other: "other"
});
InspectorBackend.registerEnum("Network.InitiatorType", {
    Parser: "parser",
    Script: "script",
    Other: "other"
});
InspectorBackend.registerEnum("Network.CookieSameSite", {
    Strict: "Strict",
    Lax: "Lax"
});
InspectorBackend.registerEvent("Network.requestWillBeSent", ["requestId", "frameId", "loaderId", "documentURL", "request", "timestamp", "wallTime", "initiator", "redirectResponse", "type"]);
InspectorBackend.registerEvent("Network.requestServedFromCache", ["requestId"]);
InspectorBackend.registerEvent("Network.responseReceived", ["requestId", "frameId", "loaderId", "timestamp", "type", "response"]);
InspectorBackend.registerEvent("Network.dataReceived", ["requestId", "timestamp", "dataLength", "encodedDataLength"]);
InspectorBackend.registerEvent("Network.loadingFinished", ["requestId", "timestamp", "encodedDataLength"]);
InspectorBackend.registerEvent("Network.loadingFailed", ["requestId", "timestamp", "type", "errorText", "canceled", "blockedReason"]);
InspectorBackend.registerEvent("Network.webSocketWillSendHandshakeRequest", ["requestId", "timestamp", "wallTime", "request"]);
InspectorBackend.registerEvent("Network.webSocketHandshakeResponseReceived", ["requestId", "timestamp", "response"]);
InspectorBackend.registerEvent("Network.webSocketCreated", ["requestId", "url"]);
InspectorBackend.registerEvent("Network.webSocketClosed", ["requestId", "timestamp"]);
InspectorBackend.registerEvent("Network.webSocketFrameReceived", ["requestId", "timestamp", "response"]);
InspectorBackend.registerEvent("Network.webSocketFrameError", ["requestId", "timestamp", "errorMessage"]);
InspectorBackend.registerEvent("Network.webSocketFrameSent", ["requestId", "timestamp", "response"]);
InspectorBackend.registerEvent("Network.eventSourceMessageReceived", ["requestId", "timestamp", "eventName", "eventId", "data"]);
InspectorBackend.registerCommand("Network.enable", [{
    "name": "maxTotalBufferSize",
    "type": "number",
    "optional": true
}, {
    "name": "maxResourceBufferSize",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Network.disable", [], [], false);
InspectorBackend.registerCommand("Network.setUserAgentOverride", [{
    "name": "userAgent",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.setExtraHTTPHeaders", [{
    "name": "headers",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.getResponseBody", [{
    "name": "requestId",
    "type": "string",
    "optional": false
}], ["body", "base64Encoded"], false);
InspectorBackend.registerCommand("Network.addBlockedURL", [{
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.removeBlockedURL", [{
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.replayXHR", [{
    "name": "requestId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.setMonitoringXHREnabled", [{
    "name": "enabled",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.canClearBrowserCache", [], ["result"], false);
InspectorBackend.registerCommand("Network.clearBrowserCache", [], [], false);
InspectorBackend.registerCommand("Network.canClearBrowserCookies", [], ["result"], false);
InspectorBackend.registerCommand("Network.clearBrowserCookies", [], [], false);
InspectorBackend.registerCommand("Network.getCookies", [], ["cookies"], false);
InspectorBackend.registerCommand("Network.deleteCookie", [{
    "name": "cookieName",
    "type": "string",
    "optional": false
}, {
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.canEmulateNetworkConditions", [], ["result"], false);
InspectorBackend.registerCommand("Network.emulateNetworkConditions", [{
    "name": "offline",
    "type": "boolean",
    "optional": false
}, {
    "name": "latency",
    "type": "number",
    "optional": false
}, {
    "name": "downloadThroughput",
    "type": "number",
    "optional": false
}, {
    "name": "uploadThroughput",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.setCacheDisabled", [{
    "name": "cacheDisabled",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.setBypassServiceWorker", [{
    "name": "bypass",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.setDataSizeLimitsForTest", [{
    "name": "maxTotalSize",
    "type": "number",
    "optional": false
}, {
    "name": "maxResourceSize",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Network.getCertificateDetails", [{
    "name": "certificateId",
    "type": "number",
    "optional": false
}], ["result"], false);
InspectorBackend.registerCommand("Network.showCertificateViewer", [{
    "name": "certificateId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerEvent("Database.addDatabase", ["database"]);
InspectorBackend.registerCommand("Database.enable", [], [], false);
InspectorBackend.registerCommand("Database.disable", [], [], false);
InspectorBackend.registerCommand("Database.getDatabaseTableNames", [{
    "name": "databaseId",
    "type": "string",
    "optional": false
}], ["tableNames"], false);
InspectorBackend.registerCommand("Database.executeSQL", [{
    "name": "databaseId",
    "type": "string",
    "optional": false
}, {
    "name": "query",
    "type": "string",
    "optional": false
}], ["columnNames", "values", "sqlError"], false);
InspectorBackend.registerEnum("IndexedDB.KeyType", {
    Number: "number",
    String: "string",
    Date: "date",
    Array: "array"
});
InspectorBackend.registerEnum("IndexedDB.KeyPathType", {
    Null: "null",
    String: "string",
    Array: "array"
});
InspectorBackend.registerCommand("IndexedDB.enable", [], [], false);
InspectorBackend.registerCommand("IndexedDB.disable", [], [], false);
InspectorBackend.registerCommand("IndexedDB.requestDatabaseNames", [{
    "name": "securityOrigin",
    "type": "string",
    "optional": false
}], ["databaseNames"], false);
InspectorBackend.registerCommand("IndexedDB.requestDatabase", [{
    "name": "securityOrigin",
    "type": "string",
    "optional": false
}, {
    "name": "databaseName",
    "type": "string",
    "optional": false
}], ["databaseWithObjectStores"], false);
InspectorBackend.registerCommand("IndexedDB.requestData", [{
    "name": "securityOrigin",
    "type": "string",
    "optional": false
}, {
    "name": "databaseName",
    "type": "string",
    "optional": false
}, {
    "name": "objectStoreName",
    "type": "string",
    "optional": false
}, {
    "name": "indexName",
    "type": "string",
    "optional": false
}, {
    "name": "skipCount",
    "type": "number",
    "optional": false
}, {
    "name": "pageSize",
    "type": "number",
    "optional": false
}, {
    "name": "keyRange",
    "type": "object",
    "optional": true
}], ["objectStoreDataEntries", "hasMore"], false);
InspectorBackend.registerCommand("IndexedDB.clearObjectStore", [{
    "name": "securityOrigin",
    "type": "string",
    "optional": false
}, {
    "name": "databaseName",
    "type": "string",
    "optional": false
}, {
    "name": "objectStoreName",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("CacheStorage.requestCacheNames", [{
    "name": "securityOrigin",
    "type": "string",
    "optional": false
}], ["caches"], false);
InspectorBackend.registerCommand("CacheStorage.requestEntries", [{
    "name": "cacheId",
    "type": "string",
    "optional": false
}, {
    "name": "skipCount",
    "type": "number",
    "optional": false
}, {
    "name": "pageSize",
    "type": "number",
    "optional": false
}], ["cacheDataEntries", "hasMore"], false);
InspectorBackend.registerCommand("CacheStorage.deleteCache", [{
    "name": "cacheId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("CacheStorage.deleteEntry", [{
    "name": "cacheId",
    "type": "string",
    "optional": false
}, {
    "name": "request",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEvent("DOMStorage.domStorageItemsCleared", ["storageId"]);
InspectorBackend.registerEvent("DOMStorage.domStorageItemRemoved", ["storageId", "key"]);
InspectorBackend.registerEvent("DOMStorage.domStorageItemAdded", ["storageId", "key", "newValue"]);
InspectorBackend.registerEvent("DOMStorage.domStorageItemUpdated", ["storageId", "key", "oldValue", "newValue"]);
InspectorBackend.registerCommand("DOMStorage.enable", [], [], false);
InspectorBackend.registerCommand("DOMStorage.disable", [], [], false);
InspectorBackend.registerCommand("DOMStorage.getDOMStorageItems", [{
    "name": "storageId",
    "type": "object",
    "optional": false
}], ["entries"], false);
InspectorBackend.registerCommand("DOMStorage.setDOMStorageItem", [{
    "name": "storageId",
    "type": "object",
    "optional": false
}, {
    "name": "key",
    "type": "string",
    "optional": false
}, {
    "name": "value",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMStorage.removeDOMStorageItem", [{
    "name": "storageId",
    "type": "object",
    "optional": false
}, {
    "name": "key",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEvent("ApplicationCache.applicationCacheStatusUpdated", ["frameId", "manifestURL", "status"]);
InspectorBackend.registerEvent("ApplicationCache.networkStateUpdated", ["isNowOnline"]);
InspectorBackend.registerCommand("ApplicationCache.getFramesWithManifests", [], ["frameIds"], false);
InspectorBackend.registerCommand("ApplicationCache.enable", [], [], false);
InspectorBackend.registerCommand("ApplicationCache.getManifestForFrame", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}], ["manifestURL"], false);
InspectorBackend.registerCommand("ApplicationCache.getApplicationCacheForFrame", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}], ["applicationCache"], false);
InspectorBackend.registerEnum("DOM.PseudoType", {
    FirstLine: "first-line",
    FirstLetter: "first-letter",
    Before: "before",
    After: "after",
    Backdrop: "backdrop",
    Selection: "selection",
    FirstLineInherited: "first-line-inherited",
    Scrollbar: "scrollbar",
    ScrollbarThumb: "scrollbar-thumb",
    ScrollbarButton: "scrollbar-button",
    ScrollbarTrack: "scrollbar-track",
    ScrollbarTrackPiece: "scrollbar-track-piece",
    ScrollbarCorner: "scrollbar-corner",
    Resizer: "resizer",
    InputListButton: "input-list-button"
});
InspectorBackend.registerEnum("DOM.ShadowRootType", {
    UserAgent: "user-agent",
    Open: "open",
    Closed: "closed"
});
InspectorBackend.registerEnum("DOM.InspectMode", {
    SearchForNode: "searchForNode",
    SearchForUAShadowDOM: "searchForUAShadowDOM",
    ShowLayoutEditor: "showLayoutEditor",
    None: "none"
});
InspectorBackend.registerEvent("DOM.documentUpdated", []);
InspectorBackend.registerEvent("DOM.inspectNodeRequested", ["backendNodeId"]);
InspectorBackend.registerEvent("DOM.setChildNodes", ["parentId", "nodes"]);
InspectorBackend.registerEvent("DOM.attributeModified", ["nodeId", "name", "value"]);
InspectorBackend.registerEvent("DOM.attributeRemoved", ["nodeId", "name"]);
InspectorBackend.registerEvent("DOM.inlineStyleInvalidated", ["nodeIds"]);
InspectorBackend.registerEvent("DOM.characterDataModified", ["nodeId", "characterData"]);
InspectorBackend.registerEvent("DOM.childNodeCountUpdated", ["nodeId", "childNodeCount"]);
InspectorBackend.registerEvent("DOM.childNodeInserted", ["parentNodeId", "previousNodeId", "node"]);
InspectorBackend.registerEvent("DOM.childNodeRemoved", ["parentNodeId", "nodeId"]);
InspectorBackend.registerEvent("DOM.shadowRootPushed", ["hostId", "root"]);
InspectorBackend.registerEvent("DOM.shadowRootPopped", ["hostId", "rootId"]);
InspectorBackend.registerEvent("DOM.pseudoElementAdded", ["parentId", "pseudoElement"]);
InspectorBackend.registerEvent("DOM.pseudoElementRemoved", ["parentId", "pseudoElementId"]);
InspectorBackend.registerEvent("DOM.distributedNodesUpdated", ["insertionPointId", "distributedNodes"]);
InspectorBackend.registerEvent("DOM.nodeHighlightRequested", ["nodeId"]);
InspectorBackend.registerCommand("DOM.enable", [], [], false);
InspectorBackend.registerCommand("DOM.disable", [], [], false);
InspectorBackend.registerCommand("DOM.getDocument", [], ["root"], false);
InspectorBackend.registerCommand("DOM.requestChildNodes", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "depth",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.querySelector", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "selector",
    "type": "string",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.querySelectorAll", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "selector",
    "type": "string",
    "optional": false
}], ["nodeIds"], false);
InspectorBackend.registerCommand("DOM.setNodeName", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "name",
    "type": "string",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.setNodeValue", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "value",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.removeNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.setAttributeValue", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "name",
    "type": "string",
    "optional": false
}, {
    "name": "value",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.setAttributesAsText", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "text",
    "type": "string",
    "optional": false
}, {
    "name": "name",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.removeAttribute", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "name",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.getOuterHTML", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["outerHTML"], false);
InspectorBackend.registerCommand("DOM.setOuterHTML", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "outerHTML",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.performSearch", [{
    "name": "query",
    "type": "string",
    "optional": false
}, {
    "name": "includeUserAgentShadowDOM",
    "type": "boolean",
    "optional": true
}], ["searchId", "resultCount"], false);
InspectorBackend.registerCommand("DOM.getSearchResults", [{
    "name": "searchId",
    "type": "string",
    "optional": false
}, {
    "name": "fromIndex",
    "type": "number",
    "optional": false
}, {
    "name": "toIndex",
    "type": "number",
    "optional": false
}], ["nodeIds"], false);
InspectorBackend.registerCommand("DOM.discardSearchResults", [{
    "name": "searchId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.requestNode", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.setInspectMode", [{
    "name": "mode",
    "type": "string",
    "optional": false
}, {
    "name": "highlightConfig",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.highlightRect", [{
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "width",
    "type": "number",
    "optional": false
}, {
    "name": "height",
    "type": "number",
    "optional": false
}, {
    "name": "color",
    "type": "object",
    "optional": true
}, {
    "name": "outlineColor",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.highlightQuad", [{
    "name": "quad",
    "type": "object",
    "optional": false
}, {
    "name": "color",
    "type": "object",
    "optional": true
}, {
    "name": "outlineColor",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.highlightNode", [{
    "name": "highlightConfig",
    "type": "object",
    "optional": false
}, {
    "name": "nodeId",
    "type": "number",
    "optional": true
}, {
    "name": "backendNodeId",
    "type": "number",
    "optional": true
}, {
    "name": "objectId",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.hideHighlight", [], [], false);
InspectorBackend.registerCommand("DOM.highlightFrame", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}, {
    "name": "contentColor",
    "type": "object",
    "optional": true
}, {
    "name": "contentOutlineColor",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOM.pushNodeByPathToFrontend", [{
    "name": "path",
    "type": "string",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.pushNodesByBackendIdsToFrontend", [{
    "name": "backendNodeIds",
    "type": "object",
    "optional": false
}], ["nodeIds"], false);
InspectorBackend.registerCommand("DOM.setInspectedNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.resolveNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "objectGroup",
    "type": "string",
    "optional": true
}], ["object"], false);
InspectorBackend.registerCommand("DOM.getAttributes", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["attributes"], false);
InspectorBackend.registerCommand("DOM.copyTo", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "targetNodeId",
    "type": "number",
    "optional": false
}, {
    "name": "insertBeforeNodeId",
    "type": "number",
    "optional": true
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.moveTo", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "targetNodeId",
    "type": "number",
    "optional": false
}, {
    "name": "insertBeforeNodeId",
    "type": "number",
    "optional": true
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.undo", [], [], false);
InspectorBackend.registerCommand("DOM.redo", [], [], false);
InspectorBackend.registerCommand("DOM.markUndoableState", [], [], false);
InspectorBackend.registerCommand("DOM.focus", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.setFileInputFiles", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "files",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOM.getBoxModel", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["model"], false);
InspectorBackend.registerCommand("DOM.getNodeForLocation", [{
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.getRelayoutBoundary", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["nodeId"], false);
InspectorBackend.registerCommand("DOM.getHighlightObjectForTest", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["highlight"], false);
InspectorBackend.registerEnum("CSS.StyleSheetOrigin", {
    Injected: "injected",
    UserAgent: "user-agent",
    Inspector: "inspector",
    Regular: "regular"
});
InspectorBackend.registerEnum("CSS.CSSMediaSource", {
    MediaRule: "mediaRule",
    ImportRule: "importRule",
    LinkedSheet: "linkedSheet",
    InlineSheet: "inlineSheet"
});
InspectorBackend.registerEvent("CSS.mediaQueryResultChanged", []);
InspectorBackend.registerEvent("CSS.styleSheetChanged", ["styleSheetId"]);
InspectorBackend.registerEvent("CSS.styleSheetAdded", ["header"]);
InspectorBackend.registerEvent("CSS.styleSheetRemoved", ["styleSheetId"]);
InspectorBackend.registerEvent("CSS.layoutEditorChange", ["styleSheetId", "changeRange"]);
InspectorBackend.registerCommand("CSS.enable", [], [], false);
InspectorBackend.registerCommand("CSS.disable", [], [], false);
InspectorBackend.registerCommand("CSS.getMatchedStylesForNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["inlineStyle", "attributesStyle", "matchedCSSRules", "pseudoElements", "inherited", "cssKeyframesRules"], false);
InspectorBackend.registerCommand("CSS.getInlineStylesForNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["inlineStyle", "attributesStyle"], false);
InspectorBackend.registerCommand("CSS.getComputedStyleForNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["computedStyle"], false);
InspectorBackend.registerCommand("CSS.getPlatformFontsForNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["fonts"], false);
InspectorBackend.registerCommand("CSS.getStyleSheetText", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}], ["text"], false);
InspectorBackend.registerCommand("CSS.setStyleSheetText", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}, {
    "name": "text",
    "type": "string",
    "optional": false
}], ["sourceMapURL"], false);
InspectorBackend.registerCommand("CSS.setRuleSelector", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}, {
    "name": "range",
    "type": "object",
    "optional": false
}, {
    "name": "selector",
    "type": "string",
    "optional": false
}], ["selectorList"], false);
InspectorBackend.registerCommand("CSS.setKeyframeKey", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}, {
    "name": "range",
    "type": "object",
    "optional": false
}, {
    "name": "keyText",
    "type": "string",
    "optional": false
}], ["keyText"], false);
InspectorBackend.registerCommand("CSS.setStyleTexts", [{
    "name": "edits",
    "type": "object",
    "optional": false
}], ["styles"], false);
InspectorBackend.registerCommand("CSS.setMediaText", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}, {
    "name": "range",
    "type": "object",
    "optional": false
}, {
    "name": "text",
    "type": "string",
    "optional": false
}], ["media"], false);
InspectorBackend.registerCommand("CSS.createStyleSheet", [{
    "name": "frameId",
    "type": "string",
    "optional": false
}], ["styleSheetId"], false);
InspectorBackend.registerCommand("CSS.addRule", [{
    "name": "styleSheetId",
    "type": "string",
    "optional": false
}, {
    "name": "ruleText",
    "type": "string",
    "optional": false
}, {
    "name": "location",
    "type": "object",
    "optional": false
}], ["rule"], false);
InspectorBackend.registerCommand("CSS.forcePseudoState", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "forcedPseudoClasses",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("CSS.getMediaQueries", [], ["medias"], false);
InspectorBackend.registerCommand("CSS.setEffectivePropertyValueForNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "propertyName",
    "type": "string",
    "optional": false
}, {
    "name": "value",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("CSS.getBackgroundColors", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["backgroundColors"], false);
InspectorBackend.registerCommand("IO.read", [{
    "name": "handle",
    "type": "string",
    "optional": false
}, {
    "name": "offset",
    "type": "number",
    "optional": true
}, {
    "name": "size",
    "type": "number",
    "optional": true
}], ["data", "eof"], false);
InspectorBackend.registerCommand("IO.close", [{
    "name": "handle",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("Debugger.GeneratorObjectDetailsStatus", {
    Running: "running",
    Suspended: "suspended",
    Closed: "closed"
});
InspectorBackend.registerEnum("Debugger.ScopeType", {
    Global: "global",
    Local: "local",
    With: "with",
    Closure: "closure",
    Catch: "catch",
    Block: "block",
    Script: "script"
});
InspectorBackend.registerEvent("Debugger.scriptParsed", ["scriptId", "url", "startLine", "startColumn", "endLine", "endColumn", "executionContextId", "hash", "isContentScript", "isInternalScript", "isLiveEdit", "sourceMapURL", "hasSourceURL", "deprecatedCommentWasUsed"]);
InspectorBackend.registerEvent("Debugger.scriptFailedToParse", ["scriptId", "url", "startLine", "startColumn", "endLine", "endColumn", "executionContextId", "hash", "isContentScript", "isInternalScript", "sourceMapURL", "hasSourceURL", "deprecatedCommentWasUsed"]);
InspectorBackend.registerEvent("Debugger.breakpointResolved", ["breakpointId", "location"]);
InspectorBackend.registerEvent("Debugger.paused", ["callFrames", "reason", "data", "hitBreakpoints", "asyncStackTrace"]);
InspectorBackend.registerEvent("Debugger.resumed", []);
InspectorBackend.registerCommand("Debugger.enable", [], [], false);
InspectorBackend.registerCommand("Debugger.disable", [], [], false);
InspectorBackend.registerCommand("Debugger.setBreakpointsActive", [{
    "name": "active",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.setSkipAllPauses", [{
    "name": "skipped",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.setBreakpointByUrl", [{
    "name": "lineNumber",
    "type": "number",
    "optional": false
}, {
    "name": "url",
    "type": "string",
    "optional": true
}, {
    "name": "urlRegex",
    "type": "string",
    "optional": true
}, {
    "name": "columnNumber",
    "type": "number",
    "optional": true
}, {
    "name": "condition",
    "type": "string",
    "optional": true
}], ["breakpointId", "locations"], false);
InspectorBackend.registerCommand("Debugger.setBreakpoint", [{
    "name": "location",
    "type": "object",
    "optional": false
}, {
    "name": "condition",
    "type": "string",
    "optional": true
}], ["breakpointId", "actualLocation"], false);
InspectorBackend.registerCommand("Debugger.removeBreakpoint", [{
    "name": "breakpointId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.continueToLocation", [{
    "name": "location",
    "type": "object",
    "optional": false
}, {
    "name": "interstatementLocation",
    "type": "boolean",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Debugger.stepOver", [], [], false);
InspectorBackend.registerCommand("Debugger.stepInto", [], [], false);
InspectorBackend.registerCommand("Debugger.stepOut", [], [], false);
InspectorBackend.registerCommand("Debugger.pause", [], [], false);
InspectorBackend.registerCommand("Debugger.resume", [], [], false);
InspectorBackend.registerCommand("Debugger.searchInContent", [{
    "name": "scriptId",
    "type": "string",
    "optional": false
}, {
    "name": "query",
    "type": "string",
    "optional": false
}, {
    "name": "caseSensitive",
    "type": "boolean",
    "optional": true
}, {
    "name": "isRegex",
    "type": "boolean",
    "optional": true
}], ["result"], false);
InspectorBackend.registerCommand("Debugger.canSetScriptSource", [], ["result"], false);
InspectorBackend.registerCommand("Debugger.setScriptSource", [{
    "name": "scriptId",
    "type": "string",
    "optional": false
}, {
    "name": "scriptSource",
    "type": "string",
    "optional": false
}, {
    "name": "preview",
    "type": "boolean",
    "optional": true
}], ["callFrames", "stackChanged", "asyncStackTrace", "compileError"], false);
InspectorBackend.registerCommand("Debugger.restartFrame", [{
    "name": "callFrameId",
    "type": "string",
    "optional": false
}], ["callFrames", "asyncStackTrace"], false);
InspectorBackend.registerCommand("Debugger.getScriptSource", [{
    "name": "scriptId",
    "type": "string",
    "optional": false
}], ["scriptSource"], false);
InspectorBackend.registerCommand("Debugger.getFunctionDetails", [{
    "name": "functionId",
    "type": "string",
    "optional": false
}], ["details"], false);
InspectorBackend.registerCommand("Debugger.getGeneratorObjectDetails", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], ["details"], false);
InspectorBackend.registerCommand("Debugger.getCollectionEntries", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], ["entries"], false);
InspectorBackend.registerCommand("Debugger.setPauseOnExceptions", [{
    "name": "state",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.evaluateOnCallFrame", [{
    "name": "callFrameId",
    "type": "string",
    "optional": false
}, {
    "name": "expression",
    "type": "string",
    "optional": false
}, {
    "name": "objectGroup",
    "type": "string",
    "optional": true
}, {
    "name": "includeCommandLineAPI",
    "type": "boolean",
    "optional": true
}, {
    "name": "doNotPauseOnExceptionsAndMuteConsole",
    "type": "boolean",
    "optional": true
}, {
    "name": "returnByValue",
    "type": "boolean",
    "optional": true
}, {
    "name": "generatePreview",
    "type": "boolean",
    "optional": true
}], ["result", "wasThrown", "exceptionDetails"], false);
InspectorBackend.registerCommand("Debugger.setVariableValue", [{
    "name": "scopeNumber",
    "type": "number",
    "optional": false
}, {
    "name": "variableName",
    "type": "string",
    "optional": false
}, {
    "name": "newValue",
    "type": "object",
    "optional": false
}, {
    "name": "callFrameId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.getBacktrace", [], ["callFrames", "asyncStackTrace"], false);
InspectorBackend.registerCommand("Debugger.setAsyncCallStackDepth", [{
    "name": "maxDepth",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.setBlackboxPatterns", [{
    "name": "patterns",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Debugger.setBlackboxedRanges", [{
    "name": "scriptId",
    "type": "string",
    "optional": false
}, {
    "name": "positions",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("DOMDebugger.DOMBreakpointType", {
    SubtreeModified: "subtree-modified",
    AttributeModified: "attribute-modified",
    NodeRemoved: "node-removed"
});
InspectorBackend.registerCommand("DOMDebugger.setDOMBreakpoint", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "type",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.removeDOMBreakpoint", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}, {
    "name": "type",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.setEventListenerBreakpoint", [{
    "name": "eventName",
    "type": "string",
    "optional": false
}, {
    "name": "targetName",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.removeEventListenerBreakpoint", [{
    "name": "eventName",
    "type": "string",
    "optional": false
}, {
    "name": "targetName",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.setInstrumentationBreakpoint", [{
    "name": "eventName",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.removeInstrumentationBreakpoint", [{
    "name": "eventName",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.setXHRBreakpoint", [{
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.removeXHRBreakpoint", [{
    "name": "url",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DOMDebugger.getEventListeners", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], ["listeners"], false);
InspectorBackend.registerEvent("Profiler.consoleProfileStarted", ["id", "location", "title"]);
InspectorBackend.registerEvent("Profiler.consoleProfileFinished", ["id", "location", "profile", "title"]);
InspectorBackend.registerCommand("Profiler.enable", [], [], false);
InspectorBackend.registerCommand("Profiler.disable", [], [], false);
InspectorBackend.registerCommand("Profiler.setSamplingInterval", [{
    "name": "interval",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Profiler.start", [], [], false);
InspectorBackend.registerCommand("Profiler.stop", [], ["profile"], false);
InspectorBackend.registerEvent("HeapProfiler.addHeapSnapshotChunk", ["chunk"]);
InspectorBackend.registerEvent("HeapProfiler.resetProfiles", []);
InspectorBackend.registerEvent("HeapProfiler.reportHeapSnapshotProgress", ["done", "total", "finished"]);
InspectorBackend.registerEvent("HeapProfiler.lastSeenObjectId", ["lastSeenObjectId", "timestamp"]);
InspectorBackend.registerEvent("HeapProfiler.heapStatsUpdate", ["statsUpdate"]);
InspectorBackend.registerCommand("HeapProfiler.enable", [], [], false);
InspectorBackend.registerCommand("HeapProfiler.disable", [], [], false);
InspectorBackend.registerCommand("HeapProfiler.startTrackingHeapObjects", [{
    "name": "trackAllocations",
    "type": "boolean",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("HeapProfiler.stopTrackingHeapObjects", [{
    "name": "reportProgress",
    "type": "boolean",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("HeapProfiler.takeHeapSnapshot", [{
    "name": "reportProgress",
    "type": "boolean",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("HeapProfiler.collectGarbage", [], [], false);
InspectorBackend.registerCommand("HeapProfiler.getObjectByHeapObjectId", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}, {
    "name": "objectGroup",
    "type": "string",
    "optional": true
}], ["result"], false);
InspectorBackend.registerCommand("HeapProfiler.addInspectedHeapObject", [{
    "name": "heapObjectId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("HeapProfiler.getHeapObjectId", [{
    "name": "objectId",
    "type": "string",
    "optional": false
}], ["heapSnapshotObjectId"], false);
InspectorBackend.registerCommand("HeapProfiler.startSampling", [], [], false);
InspectorBackend.registerCommand("HeapProfiler.stopSampling", [], ["profile"], false);
InspectorBackend.registerEvent("Worker.workerCreated", ["workerId", "url", "waitingForDebugger"]);
InspectorBackend.registerEvent("Worker.workerTerminated", ["workerId"]);
InspectorBackend.registerEvent("Worker.dispatchMessageFromWorker", ["workerId", "message"]);
InspectorBackend.registerCommand("Worker.enable", [], [], false);
InspectorBackend.registerCommand("Worker.disable", [], [], false);
InspectorBackend.registerCommand("Worker.sendMessageToWorker", [{
    "name": "workerId",
    "type": "string",
    "optional": false
}, {
    "name": "message",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Worker.setWaitForDebuggerOnStart", [{
    "name": "value",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("ServiceWorker.ServiceWorkerVersionRunningStatus", {
    Stopped: "stopped",
    Starting: "starting",
    Running: "running",
    Stopping: "stopping"
});
InspectorBackend.registerEnum("ServiceWorker.ServiceWorkerVersionStatus", {
    New: "new",
    Installing: "installing",
    Installed: "installed",
    Activating: "activating",
    Activated: "activated",
    Redundant: "redundant"
});
InspectorBackend.registerEvent("ServiceWorker.workerCreated", ["workerId", "url", "versionId"]);
InspectorBackend.registerEvent("ServiceWorker.workerTerminated", ["workerId"]);
InspectorBackend.registerEvent("ServiceWorker.dispatchMessage", ["workerId", "message"]);
InspectorBackend.registerEvent("ServiceWorker.workerRegistrationUpdated", ["registrations"]);
InspectorBackend.registerEvent("ServiceWorker.workerVersionUpdated", ["versions"]);
InspectorBackend.registerEvent("ServiceWorker.workerErrorReported", ["errorMessage"]);
InspectorBackend.registerCommand("ServiceWorker.enable", [], [], false);
InspectorBackend.registerCommand("ServiceWorker.disable", [], [], false);
InspectorBackend.registerCommand("ServiceWorker.sendMessage", [{
    "name": "workerId",
    "type": "string",
    "optional": false
}, {
    "name": "message",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.stop", [{
    "name": "workerId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.unregister", [{
    "name": "scopeURL",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.updateRegistration", [{
    "name": "scopeURL",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.startWorker", [{
    "name": "scopeURL",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.stopWorker", [{
    "name": "versionId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.inspectWorker", [{
    "name": "versionId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.setForceUpdateOnPageLoad", [{
    "name": "forceUpdateOnPageLoad",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.deliverPushMessage", [{
    "name": "origin",
    "type": "string",
    "optional": false
}, {
    "name": "registrationId",
    "type": "string",
    "optional": false
}, {
    "name": "data",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("ServiceWorker.getTargetInfo", [{
    "name": "targetId",
    "type": "string",
    "optional": false
}], ["targetInfo"], false);
InspectorBackend.registerCommand("ServiceWorker.activateTarget", [{
    "name": "targetId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("Input.TouchPointState", {
    TouchPressed: "touchPressed",
    TouchReleased: "touchReleased",
    TouchMoved: "touchMoved",
    TouchStationary: "touchStationary",
    TouchCancelled: "touchCancelled"
});
InspectorBackend.registerEnum("Input.GestureSourceType", {
    Default: "default",
    Touch: "touch",
    Mouse: "mouse"
});
InspectorBackend.registerCommand("Input.dispatchKeyEvent", [{
    "name": "type",
    "type": "string",
    "optional": false
}, {
    "name": "modifiers",
    "type": "number",
    "optional": true
}, {
    "name": "timestamp",
    "type": "number",
    "optional": true
}, {
    "name": "text",
    "type": "string",
    "optional": true
}, {
    "name": "unmodifiedText",
    "type": "string",
    "optional": true
}, {
    "name": "keyIdentifier",
    "type": "string",
    "optional": true
}, {
    "name": "code",
    "type": "string",
    "optional": true
}, {
    "name": "key",
    "type": "string",
    "optional": true
}, {
    "name": "windowsVirtualKeyCode",
    "type": "number",
    "optional": true
}, {
    "name": "nativeVirtualKeyCode",
    "type": "number",
    "optional": true
}, {
    "name": "autoRepeat",
    "type": "boolean",
    "optional": true
}, {
    "name": "isKeypad",
    "type": "boolean",
    "optional": true
}, {
    "name": "isSystemKey",
    "type": "boolean",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.dispatchMouseEvent", [{
    "name": "type",
    "type": "string",
    "optional": false
}, {
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "modifiers",
    "type": "number",
    "optional": true
}, {
    "name": "timestamp",
    "type": "number",
    "optional": true
}, {
    "name": "button",
    "type": "string",
    "optional": true
}, {
    "name": "clickCount",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.dispatchTouchEvent", [{
    "name": "type",
    "type": "string",
    "optional": false
}, {
    "name": "touchPoints",
    "type": "object",
    "optional": false
}, {
    "name": "modifiers",
    "type": "number",
    "optional": true
}, {
    "name": "timestamp",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.emulateTouchFromMouseEvent", [{
    "name": "type",
    "type": "string",
    "optional": false
}, {
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "timestamp",
    "type": "number",
    "optional": false
}, {
    "name": "button",
    "type": "string",
    "optional": false
}, {
    "name": "deltaX",
    "type": "number",
    "optional": true
}, {
    "name": "deltaY",
    "type": "number",
    "optional": true
}, {
    "name": "modifiers",
    "type": "number",
    "optional": true
}, {
    "name": "clickCount",
    "type": "number",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.synthesizePinchGesture", [{
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "scaleFactor",
    "type": "number",
    "optional": false
}, {
    "name": "relativeSpeed",
    "type": "number",
    "optional": true
}, {
    "name": "gestureSourceType",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.synthesizeScrollGesture", [{
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "xDistance",
    "type": "number",
    "optional": true
}, {
    "name": "yDistance",
    "type": "number",
    "optional": true
}, {
    "name": "xOverscroll",
    "type": "number",
    "optional": true
}, {
    "name": "yOverscroll",
    "type": "number",
    "optional": true
}, {
    "name": "preventFling",
    "type": "boolean",
    "optional": true
}, {
    "name": "speed",
    "type": "number",
    "optional": true
}, {
    "name": "gestureSourceType",
    "type": "string",
    "optional": true
}, {
    "name": "repeatCount",
    "type": "number",
    "optional": true
}, {
    "name": "repeatDelayMs",
    "type": "number",
    "optional": true
}, {
    "name": "interactionMarkerName",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Input.synthesizeTapGesture", [{
    "name": "x",
    "type": "number",
    "optional": false
}, {
    "name": "y",
    "type": "number",
    "optional": false
}, {
    "name": "duration",
    "type": "number",
    "optional": true
}, {
    "name": "tapCount",
    "type": "number",
    "optional": true
}, {
    "name": "gestureSourceType",
    "type": "string",
    "optional": true
}], [], false);
InspectorBackend.registerEnum("LayerTree.ScrollRectType", {
    RepaintsOnScroll: "RepaintsOnScroll",
    TouchEventHandler: "TouchEventHandler",
    WheelEventHandler: "WheelEventHandler"
});
InspectorBackend.registerEvent("LayerTree.layerTreeDidChange", ["layers"]);
InspectorBackend.registerEvent("LayerTree.layerPainted", ["layerId", "clip"]);
InspectorBackend.registerCommand("LayerTree.enable", [], [], false);
InspectorBackend.registerCommand("LayerTree.disable", [], [], false);
InspectorBackend.registerCommand("LayerTree.compositingReasons", [{
    "name": "layerId",
    "type": "string",
    "optional": false
}], ["compositingReasons"], false);
InspectorBackend.registerCommand("LayerTree.makeSnapshot", [{
    "name": "layerId",
    "type": "string",
    "optional": false
}], ["snapshotId"], false);
InspectorBackend.registerCommand("LayerTree.loadSnapshot", [{
    "name": "tiles",
    "type": "object",
    "optional": false
}], ["snapshotId"], false);
InspectorBackend.registerCommand("LayerTree.releaseSnapshot", [{
    "name": "snapshotId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("LayerTree.profileSnapshot", [{
    "name": "snapshotId",
    "type": "string",
    "optional": false
}, {
    "name": "minRepeatCount",
    "type": "number",
    "optional": true
}, {
    "name": "minDuration",
    "type": "number",
    "optional": true
}, {
    "name": "clipRect",
    "type": "object",
    "optional": true
}], ["timings"], false);
InspectorBackend.registerCommand("LayerTree.replaySnapshot", [{
    "name": "snapshotId",
    "type": "string",
    "optional": false
}, {
    "name": "fromStep",
    "type": "number",
    "optional": true
}, {
    "name": "toStep",
    "type": "number",
    "optional": true
}, {
    "name": "scale",
    "type": "number",
    "optional": true
}], ["dataURL"], false);
InspectorBackend.registerCommand("LayerTree.snapshotCommandLog", [{
    "name": "snapshotId",
    "type": "string",
    "optional": false
}], ["commandLog"], false);
InspectorBackend.registerCommand("DeviceOrientation.setDeviceOrientationOverride", [{
    "name": "alpha",
    "type": "number",
    "optional": false
}, {
    "name": "beta",
    "type": "number",
    "optional": false
}, {
    "name": "gamma",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("DeviceOrientation.clearDeviceOrientationOverride", [], [], false);
InspectorBackend.registerEnum("Tracing.MemoryDumpTriggerMode", {
    Light: "light",
    Detailed: "detailed"
});
InspectorBackend.registerEnum("Tracing.TraceConfigRecordMode", {
    RecordUntilFull: "recordUntilFull",
    RecordContinuously: "recordContinuously",
    RecordAsMuchAsPossible: "recordAsMuchAsPossible",
    EchoToConsole: "echoToConsole"
});
InspectorBackend.registerEvent("Tracing.dataCollected", ["value"]);
InspectorBackend.registerEvent("Tracing.tracingComplete", ["stream"]);
InspectorBackend.registerEvent("Tracing.bufferUsage", ["percentFull", "eventCount", "value"]);
InspectorBackend.registerCommand("Tracing.start", [{
    "name": "categories",
    "type": "string",
    "optional": true
}, {
    "name": "options",
    "type": "string",
    "optional": true
}, {
    "name": "bufferUsageReportingInterval",
    "type": "number",
    "optional": true
}, {
    "name": "transferMode",
    "type": "string",
    "optional": true
}, {
    "name": "traceConfig",
    "type": "object",
    "optional": true
}], [], false);
InspectorBackend.registerCommand("Tracing.end", [], [], false);
InspectorBackend.registerCommand("Tracing.getCategories", [], ["categories"], false);
InspectorBackend.registerCommand("Tracing.requestMemoryDump", [], ["dumpGuid", "success"], false);
InspectorBackend.registerCommand("Tracing.recordClockSyncMarker", [{
    "name": "syncId",
    "type": "string",
    "optional": false
}], [], false);
InspectorBackend.registerEnum("Animation.AnimationType", {
    CSSTransition: "CSSTransition",
    CSSAnimation: "CSSAnimation",
    WebAnimation: "WebAnimation"
});
InspectorBackend.registerEvent("Animation.animationCreated", ["id"]);
InspectorBackend.registerEvent("Animation.animationStarted", ["animation"]);
InspectorBackend.registerEvent("Animation.animationCanceled", ["id"]);
InspectorBackend.registerCommand("Animation.enable", [], [], false);
InspectorBackend.registerCommand("Animation.disable", [], [], false);
InspectorBackend.registerCommand("Animation.getPlaybackRate", [], ["playbackRate"], false);
InspectorBackend.registerCommand("Animation.setPlaybackRate", [{
    "name": "playbackRate",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Animation.getCurrentTime", [{
    "name": "id",
    "type": "string",
    "optional": false
}], ["currentTime"], false);
InspectorBackend.registerCommand("Animation.setPaused", [{
    "name": "animations",
    "type": "object",
    "optional": false
}, {
    "name": "paused",
    "type": "boolean",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Animation.setTiming", [{
    "name": "animationId",
    "type": "string",
    "optional": false
}, {
    "name": "duration",
    "type": "number",
    "optional": false
}, {
    "name": "delay",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Animation.seekAnimations", [{
    "name": "animations",
    "type": "object",
    "optional": false
}, {
    "name": "currentTime",
    "type": "number",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Animation.releaseAnimations", [{
    "name": "animations",
    "type": "object",
    "optional": false
}], [], false);
InspectorBackend.registerCommand("Animation.resolveAnimation", [{
    "name": "animationId",
    "type": "string",
    "optional": false
}], ["remoteObject"], false);
InspectorBackend.registerEnum("Accessibility.AXValueType", {
    Boolean: "boolean",
    Tristate: "tristate",
    BooleanOrUndefined: "booleanOrUndefined",
    Idref: "idref",
    IdrefList: "idrefList",
    Integer: "integer",
    Node: "node",
    NodeList: "nodeList",
    Number: "number",
    String: "string",
    ComputedString: "computedString",
    Token: "token",
    TokenList: "tokenList",
    DomRelation: "domRelation",
    Role: "role",
    InternalRole: "internalRole",
    ValueUndefined: "valueUndefined"
});
InspectorBackend.registerEnum("Accessibility.AXValueSourceType", {
    Attribute: "attribute",
    Implicit: "implicit",
    Style: "style",
    Contents: "contents",
    Placeholder: "placeholder",
    RelatedElement: "relatedElement"
});
InspectorBackend.registerEnum("Accessibility.AXValueNativeSourceType", {
    Figcaption: "figcaption",
    Label: "label",
    Labelfor: "labelfor",
    Labelwrapped: "labelwrapped",
    Legend: "legend",
    Tablecaption: "tablecaption",
    Title: "title",
    Other: "other"
});
InspectorBackend.registerEnum("Accessibility.AXGlobalStates", {
    Disabled: "disabled",
    Hidden: "hidden",
    HiddenRoot: "hiddenRoot",
    Invalid: "invalid"
});
InspectorBackend.registerEnum("Accessibility.AXLiveRegionAttributes", {
    Live: "live",
    Atomic: "atomic",
    Relevant: "relevant",
    Busy: "busy",
    Root: "root"
});
InspectorBackend.registerEnum("Accessibility.AXWidgetAttributes", {
    Autocomplete: "autocomplete",
    Haspopup: "haspopup",
    Level: "level",
    Multiselectable: "multiselectable",
    Orientation: "orientation",
    Multiline: "multiline",
    Readonly: "readonly",
    Required: "required",
    Valuemin: "valuemin",
    Valuemax: "valuemax",
    Valuetext: "valuetext"
});
InspectorBackend.registerEnum("Accessibility.AXWidgetStates", {
    Checked: "checked",
    Expanded: "expanded",
    Pressed: "pressed",
    Selected: "selected"
});
InspectorBackend.registerEnum("Accessibility.AXRelationshipAttributes", {
    Activedescendant: "activedescendant",
    Flowto: "flowto",
    Controls: "controls",
    Describedby: "describedby",
    Labelledby: "labelledby",
    Owns: "owns"
});
InspectorBackend.registerCommand("Accessibility.getAXNode", [{
    "name": "nodeId",
    "type": "number",
    "optional": false
}], ["accessibilityNode"], false);

