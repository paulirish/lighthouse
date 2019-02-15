/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import parseManifest = require('../lighthouse-core/lib/manifest-parser.js');
import _LanternSimulator = require('../lighthouse-core/lib/dependency-graph/simulator/simulator.js');
import _NetworkRequest = require('../lighthouse-core/lib/network-request.js');
import speedline = require('speedline-core');

type _TaskNode = import('../lighthouse-core/computed/main-thread-tasks.js').TaskNode;

type LanternSimulator = InstanceType<typeof _LanternSimulator>;

declare global {
  module LH {
    export interface Artifacts extends BaseArtifacts, GathererArtifacts {}

    /** Artifacts always created by GatherRunner. */
    export interface BaseArtifacts {
      /** The ISO-8601 timestamp of when the test page was fetched and artifacts collected. */
      fetchTime: string;
      /** A set of warnings about unexpected things encountered while loading and testing the page. */
      LighthouseRunWarnings: string[];
      /** The user agent string of the version of Chrome used. */
      HostUserAgent: string;
      /** The user agent string that Lighthouse used to load the page. */
      NetworkUserAgent: string;
      /** The benchmark index that indicates rough device class. */
      BenchmarkIndex: number;
      /** Parsed version of the page's Web App Manifest, or null if none found. */
      WebAppManifest: Artifacts.Manifest | null;
      /** A set of page-load traces, keyed by passName. */
      traces: {[passName: string]: Trace};
      /** A set of DevTools debugger protocol records, keyed by passName. */
      devtoolsLogs: {[passName: string]: DevtoolsLog};
      /** An object containing information about the testing configuration used by Lighthouse. */
      settings: Config.Settings;
      /** The URL initially requested and the post-redirects URL that was actually loaded. */
      URL: {requestedUrl: string, finalUrl: string};
      /** The timing instrumentation of the gather portion of a run. */
      Timing: Artifacts.MeasureEntry[];
    }

    /**
     * Artifacts provided by the default gatherers. Augment this interface when adding additional
     * gatherers.
     */
    export interface GathererArtifacts {
      /** The results of running the aXe accessibility tests on the page. */
      Accessibility: Artifacts.Accessibility;
      /** Array of all anchors on the page. */
      AnchorElements: Artifacts.AnchorElement[];
      /** The value of the page's <html> manifest attribute, or null if not defined */
      AppCacheManifest: string | null;
      /** Array of all URLs cached in CacheStorage. */
      CacheContents: string[];
      /** Href values of link[rel=canonical] nodes found in HEAD (or null, if no href attribute). */
      Canonical: (string | null)[];
      /** Console deprecation and intervention warnings logged by Chrome during page load. */
      ChromeConsoleMessages: Crdp.Log.EntryAddedEvent[];
      /** CSS coverage information for styles used by page's final state. */
      CSSUsage: {rules: Crdp.CSS.RuleUsage[], stylesheets: Artifacts.CSSStyleSheetInfo[]};
      /** Information on the document's doctype(or null if not present), specifically the name, publicId, and systemId.
          All properties default to an empty string if not present */
      Doctype: Artifacts.Doctype | null;
      /** Information on the size of all DOM nodes in the page and the most extreme members. */
      DOMStats: Artifacts.DOMStats;
      /** Relevant attributes and child properties of all <object>s, <embed>s and <applet>s in the page. */
      EmbeddedContent: Artifacts.EmbeddedContentInfo[];
      /** All the link elements on the page. */
      LinkElements: Artifacts.LinkElement[];
      /** Information for font faces used in the page. */
      Fonts: Artifacts.Font[];
      /** Information on poorly sized font usage and the text affected by it. */
      FontSize: Artifacts.FontSize;
      /** The hreflang and href values of all link[rel=alternate] nodes found in HEAD. */
      Hreflang: {href: string, hreflang: string}[];
      /** The page's document body innerText if loaded with JavaScript disabled. */
      HTMLWithoutJavaScript: {bodyText: string, hasNoScript: boolean};
      /** Whether the page ended up on an HTTPS page after attempting to load the HTTP version. */
      HTTPRedirect: {value: boolean};
      /** Information on size and loading for all the images in the page. */
      ImageElements: Artifacts.ImageElement[];
      /** Information on JS libraries and versions used by the page. */
      JSLibraries: {name: string, version: string, npmPkgName: string}[];
      /** JS coverage information for code used during page load. */
      JsUsage: Crdp.Profiler.ScriptCoverage[];
      /** Parsed version of the page's Web App Manifest, or null if none found. */
      Manifest: Artifacts.Manifest | null;
      /** The values of the <meta> elements in the head. */
      MetaElements: Array<{name: string, content?: string}>;
      /** The URL loaded with interception */
      MixedContent: {url: string};
      /** The status code of the attempted load of the page while network access is disabled. */
      Offline: number;
      /** Size and compression opportunity information for all the images in the page. */
      OptimizedImages: Array<Artifacts.OptimizedImage | Artifacts.OptimizedImageError>;
      /** HTML snippets from any password inputs that prevent pasting. */
      PasswordInputsWithPreventedPaste: {snippet: string}[];
      /** Size info of all network records sent without compression and their size after gzipping. */
      ResponseCompression: {requestId: string, url: string, mimeType: string, transferSize: number, resourceSize: number, gzipSize?: number}[];
      /** Information on fetching and the content of the /robots.txt file. */
      RobotsTxt: {status: number|null, content: string|null};
      /** Set of exceptions thrown during page load. */
      RuntimeExceptions: Crdp.Runtime.ExceptionThrownEvent[];
      /** The content of all scripts loaded by the page, keyed by networkRecord requestId. */
      Scripts: Record<string, string>;
      /** Version information for all ServiceWorkers active after the first page load. */
      ServiceWorker: {versions: Crdp.ServiceWorker.ServiceWorkerVersion[], registrations: Crdp.ServiceWorker.ServiceWorkerRegistration[]};
      /** The status of an offline fetch of the page's start_url. -1 and a explanation if missing or there was an error. */
      StartUrl: {statusCode: number, explanation?: string};
      /** Information on <script> and <link> tags blocking first paint. */
      TagsBlockingFirstPaint: Artifacts.TagBlockingFirstPaint[];
      /** Information about tap targets including their position and size. */
      TapTargets: Artifacts.TapTarget[];
      /** The dimensions and devicePixelRatio of the loaded viewport. */
      ViewportDimensions: Artifacts.ViewportDimensions;
    }

    module Artifacts {
      export type NetworkRequest = _NetworkRequest;
      export type TaskNode = _TaskNode;
      export type MetaElement = LH.Artifacts['MetaElements'][0];

      export interface Accessibility {
        violations: {
          id: string;
          impact: string;
          tags: string[];
          nodes: {
            path: string;
            html: string;
            snippet: string;
            target: string[];
            failureSummary?: string;
          }[];
        }[];
        notApplicable: {
          id: string
        }[];
      }

      export interface CSSStyleSheetInfo {
        header: Crdp.CSS.CSSStyleSheetHeader;
        content: string;
      }

      export interface Doctype {
        name: string;
        publicId: string;
        systemId: string;
      }

      export interface DOMStats {
        totalDOMNodes: number;
        width: {max: number, pathToElement: Array<string>, snippet: string};
        depth: {max: number, pathToElement: Array<string>, snippet: string};
      }

      export interface EmbeddedContentInfo {
        tagName: string;
        type: string | null;
        src: string | null;
        data: string | null;
        code: string | null;
        params: {name: string; value: string}[];
      }

      /** @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#Attributes */
      export interface LinkElement {
        rel: string
        href: string
        as: string
        crossOrigin: 'anonymous'|'use-credentials'|null
      }

      /** @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#Attributes */
      export interface AnchorElement {
        rel: string
        href: string
        text: string
        target: string
        outerHTML: string
      }

      export interface Font {
        display: string;
        family: string;
        featureSettings: string;
        stretch: string;
        style: string;
        unicodeRange: string;
        variant: string;
        weight: string;
        src?: string[];
      }

      export interface FontSize {
        totalTextLength: number;
        failingTextLength: number;
        visitedTextLength: number;
        analyzedFailingTextLength: number;
        analyzedFailingNodesData: Array<{
          fontSize: number;
          textLength: number;
          node: FontSize.DomNodeWithParent;
          cssRule?: {
            type: 'Regular' | 'Inline' | 'Attributes';
            range?: {startLine: number, startColumn: number};
            parentRule?: {origin: Crdp.CSS.StyleSheetOrigin, selectors: {text: string}[]};
            styleSheetId?: string;
            stylesheet?: Crdp.CSS.CSSStyleSheetHeader;
          }
        }>
      }

      export module FontSize {
        export interface DomNodeWithParent extends Crdp.DOM.Node {
          parentId: number;
          parentNode: DomNodeWithParent;
        }

        export interface DomNodeMaybeWithParent extends Crdp.DOM.Node {
          parentNode?: DomNodeMaybeWithParent;
        }
      }

      // TODO(bckenny): real type for parsed manifest.
      export type Manifest = ReturnType<typeof parseManifest>;

      export interface ImageElement {
        src: string;
        /** The displayed width of the image, uses img.width when available falling back to clientWidth. See https://codepen.io/patrickhulce/pen/PXvQbM for examples. */
        displayedWidth: number;
        /** The displayed height of the image, uses img.height when available falling back to clientHeight. See https://codepen.io/patrickhulce/pen/PXvQbM for examples. */
        displayedHeight: number;
        /** The natural width of the underlying image, uses img.naturalWidth. See https://codepen.io/patrickhulce/pen/PXvQbM for examples. */
        naturalWidth: number;
        /** The natural height of the underlying image, uses img.naturalHeight. See https://codepen.io/patrickhulce/pen/PXvQbM for examples. */
        naturalHeight: number;
        /** The BoundingClientRect of the element. */
        clientRect: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        /** Flags whether this element was an image via CSS background-image rather than <img> tag. */
        isCss: boolean;
        /** Flags whether this element was contained within a <picture> tag. */
        isPicture: boolean;
        /** Flags whether this element was sized using a non-default `object-fit` CSS property. */
        usesObjectFit: boolean;
        /** The size of the underlying image file in bytes. 0 if the file could not be identified. */
        resourceSize: number;
        /** The MIME type of the underlying image file. */
        mimeType?: string;
      }

      export interface OptimizedImage {
        failed: false;
        fromProtocol: boolean;
        originalSize: number;
        jpegSize: number;
        webpSize: number;

        isSameOrigin: boolean;
        isBase64DataUri: boolean;
        requestId: string;
        url: string;
        mimeType: string;
        resourceSize: number;
      }

      export interface OptimizedImageError {
        failed: true;
        errMsg: string;

        isSameOrigin: boolean;
        isBase64DataUri: boolean;
        requestId: string;
        url: string;
        mimeType: string;
        resourceSize: number;
      }

      export interface TagBlockingFirstPaint {
        startTime: number;
        endTime: number;
        transferSize: number;
        tag: {
          tagName: string;
          url: string;
        };
      }

      export interface Rect {
        width: number;
        height: number;
        top: number;
        right: number;
        bottom: number;
        left: number;
      }

      export interface TapTarget {
        snippet: string,
        selector: string,
        path: string,
        href: string,
        clientRects: Rect[]
      }

      export interface ViewportDimensions {
        innerWidth: number;
        innerHeight: number;
        outerWidth: number;
        outerHeight: number;
        devicePixelRatio: number;
      }

      // Computed artifact types below.
      export type CriticalRequestNode = {
        [id: string]: {
          request: Artifacts.NetworkRequest;
          children: CriticalRequestNode;
        }
      }

      export type ManifestValueCheckID = 'hasStartUrl'|'hasIconsAtLeast192px'|'hasIconsAtLeast512px'|'hasPWADisplayValue'|'hasBackgroundColor'|'hasThemeColor'|'hasShortName'|'hasName'|'shortNameLength';

      export type ManifestValues = {
        isParseFailure: false;
        allChecks: {
          id: ManifestValueCheckID;
          failureText: string;
          passing: boolean;
        }[];
      } | {
        isParseFailure: true;
        parseFailureReason: string;
        allChecks: {
          id: ManifestValueCheckID;
          failureText: string;
          passing: boolean;
        }[];
      }

      export interface MeasureEntry extends PerformanceEntry {
        /** Whether timing entry was collected during artifact gathering. */
        gather?: boolean;
      }

      export interface MetricComputationDataInput {
        devtoolsLog: DevtoolsLog;
        trace: Trace;
        settings: Config.Settings;
        simulator?: LanternSimulator;
      }

      export interface MetricComputationData extends MetricComputationDataInput {
        networkRecords: Array<Artifacts.NetworkRequest>;
        traceOfTab: TraceOfTab;
      }

      export interface Metric {
        timing: number;
        timestamp?: number;
      }

      export interface NetworkAnalysis {
        records: Array<NetworkRequest>;
        rtt: number;
        additionalRttByOrigin: Map<string, number>;
        serverResponseTimeByOrigin: Map<string, number>;
        throughput: number;
      }

      export interface LanternMetric {
        timing: number;
        timestamp?: never;
        optimisticEstimate: Gatherer.Simulation.Result
        pessimisticEstimate: Gatherer.Simulation.Result;
        optimisticGraph: Gatherer.Simulation.GraphNode;
        pessimisticGraph: Gatherer.Simulation.GraphNode;
      }

      export type Speedline = speedline.Output<'speedIndex'>;

      export interface TraceTimes {
        navigationStart: number;
        firstPaint?: number;
        firstContentfulPaint: number;
        firstMeaningfulPaint?: number;
        traceEnd: number;
        load?: number;
        domContentLoaded?: number;
      }

      export interface TraceOfTab {
        /** The raw timestamps of key metric events, in microseconds. */
        timestamps: TraceTimes;
        /** The relative times from navigationStart to key metric events, in milliseconds. */
        timings: TraceTimes;
        /** The subset of trace events from the page's process, sorted by timestamp. */
        processEvents: Array<TraceEvent>;
        /** The subset of trace events from the page's main thread, sorted by timestamp. */
        mainThreadEvents: Array<TraceEvent>;
        /** IDs for the trace's main frame, process, and thread. */
        mainFrameIds: {pid: number, tid: number, frameId: string};
        /** The trace event marking navigationStart. */
        navigationStartEvt: TraceEvent;
        /** The trace event marking firstPaint, if it was found. */
        firstPaintEvt?: TraceEvent;
        /** The trace event marking firstContentfulPaint, if it was found. */
        firstContentfulPaintEvt: TraceEvent;
        /** The trace event marking firstMeaningfulPaint, if it was found. */
        firstMeaningfulPaintEvt?: TraceEvent;
        /** The trace event marking loadEventEnd, if it was found. */
        loadEvt?: TraceEvent;
        /** The trace event marking domContentLoadedEventEnd, if it was found. */
        domContentLoadedEvt?: TraceEvent;
        /**
         * Whether the firstMeaningfulPaintEvt was the definitive event or a fallback to
         * firstMeaningfulPaintCandidate events had to be attempted.
         */
        fmpFellBack: boolean;
      }
    }
  }
}

// empty export to keep file a module
export {}
