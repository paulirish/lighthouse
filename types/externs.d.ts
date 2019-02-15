/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import _Crdp from 'devtools-protocol/types/protocol';
import _CrdpMappings from 'devtools-protocol/types/protocol-mapping'

declare global {
  // Augment global Error type to include node's optional `code` property
  // see https://nodejs.org/api/errors.html#errors_error_code
  interface Error {
    code?: string;
  }

  // Augment Intl to include
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/getCanonicalLocales
  namespace Intl {
    var getCanonicalLocales: (locales?: string | Array<string>) => Array<string>;
  }

  /** Make properties K in T optional. */
  type MakeOptional<T, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P]
  } & {
    [P in K]+?: T[P]
  }

  /** An object with the keys in the union K mapped to themselves as values. */
  type SelfMap<K extends string> = {
    [P in K]: P;
  };

  /** Make optional all properties on T and any properties on object properties of T. */
  type RecursivePartial<T> = {
    [P in keyof T]+?: T[P] extends object ?
      RecursivePartial<T[P]> :
      T[P];
  };

  /**
   * Exclude void from T
   */
  type NonVoid<T> = T extends void ? never : T;

  /** Remove properties K from T. */
  type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

  /** Obtain the type of the first parameter of a function. */
  type FirstParamType<T extends (arg1: any, ...args: any[]) => any> =
    T extends (arg1: infer P, ...args: any[]) => any ? P : never;

  module LH {
    // re-export useful type modules under global LH module.
    export import Crdp = _Crdp;
    export import CrdpEvents = _CrdpMappings.Events;
    export import CrdpCommands = _CrdpMappings.Commands;

    /** Simulation settings that control the amount of network & cpu throttling in the run. */
    interface ThrottlingSettings {
      // The round trip time in milliseconds
      rttMs?: number;
      // The network throughput in kilobytes per second
      throughputKbps?: number;
      // devtools settings
      // The network request latency in milliseconds
      requestLatencyMs?: number;
      // The network download throughput in kilobytes per second
      downloadThroughputKbps?: number;
      // The network upload throughput in kilobytes per second
      uploadThroughputKbps?: number;
      // used by both
      // The amount of slowdown applied to the cpu (1/<cpuSlowdownMultiplier>)
      cpuSlowdownMultiplier?: number
    }

    export type Locale = 'en-US'|'en'|'en-AU'|'en-GB'|'en-IE'|'en-SG'|'en-ZA'|'en-IN'|'ar-XB'|'ar'|'bg'|'bs'|'ca'|'cs'|'da'|'de'|'el'|'en-XA'|'es'|'fi'|'fil'|'fr'|'he'|'hi'|'hr'|'hu'|'gsw'|'id'|'in'|'it'|'iw'|'ja'|'ko'|'ln'|'lt'|'lv'|'mo'|'nl'|'nb'|'no'|'pl'|'pt'|'pt-PT'|'ro'|'ru'|'sk'|'sl'|'sr'|'sr-Latn'|'sv'|'ta'|'te'|'th'|'tl'|'tr'|'uk'|'vi'|'zh'|'zh-HK'|'zh-TW';

    export type OutputMode = 'json' | 'html' | 'csv';

    /**
     * Options that are found in both the flags used by the Lighthouse module
     * interface and the Config's `settings` object.
     */
    interface SharedFlagsSettings {
      // The output types (json, html, ...)
      output?: OutputMode|OutputMode[];
      // The locale setting
      locale?: Locale;
      // The maximum amount of time to wait for a page to load in ms
      maxWaitForLoad?: number;
      // List of URL patterns to block
      blockedUrlPatterns?: string[] | null;
      // Comma-delimited list of trace categories to include
      additionalTraceCategories?: string | null;
      // Flag indicating the run should only audit
      auditMode?: boolean | string;
      // Flag indicating the run should only gather
      gatherMode?: boolean | string;
      // Flag indicating that the browser storage should not be reset for the audit
      disableStorageReset?: boolean;
      // Flag indicating that there shouldn't be any emulation during the run
      disableDeviceEmulation?: boolean;
      // The form factor the emulation should use
      emulatedFormFactor?: 'mobile'|'desktop'|'none';
      // The method used to throttle the network
      throttlingMethod?: 'devtools'|'simulate'|'provided';
      // The throttling config settings
      throttling?: ThrottlingSettings;
      // List of audits that the run should conduct
      onlyAudits?: string[] | null;
      // List of categories of audits the run should conduct
      onlyCategories?: string[] | null;
      // List of audits that the run should skip
      skipAudits?: string[] | null;
      // List of extra HTTP Headers to include
      extraHeaders?: Crdp.Network.Headers | null; // See extraHeaders TODO in bin.js
    }

    /**
     * Extends the flags in SharedFlagsSettings with flags used to configure the
     * Lighthouse module but will not end up in the Config settings.
     */
    export interface Flags extends SharedFlagsSettings {
      port?: number;
      hostname?: string;
      logLevel?: 'silent'|'error'|'info'|'verbose';
      configPath?: string;
    }

    /**
     * Extends the flags accepted by the Lighthouse module with additional flags
     * used just for controlling the CLI.
     */
    export interface CliFlags extends Flags {
      _: string[];
      chromeFlags: string;
      // Output path for the generated assets
      outputPath: string;
      // Flag to save the trace contents and screenshots to disk
      saveAssets: boolean;
      // Flag to open the report immediately
      view: boolean;
      // Enables error reporting
      enableErrorReporting?: boolean;
      // Flag to print out a list of all audits + categories
      listAllAudits: boolean;
      // Flag to print out a list of all required trace categories
      listTraceCategories: boolean;
      // A preset audit of selected audit categories to run
      preset?: 'full'|'mixed-content'|'perf';
      verbose: boolean;
      quiet: boolean;
      // following are given defaults in cli-flags, so are not optional like in Flags or SharedFlagsSettings
      output: OutputMode[];
      port: number;
      hostname: string;
      printConfig: boolean;
    }

    export interface RunnerResult {
      lhr: Result;
      report: string|string[];
      artifacts: Artifacts;
    }

    export interface ReportCategory {
      name: string;
      description: string;
      audits: ReportAudit[];
    }

    export interface ReportAudit {
      id: string;
      weight: number;
      group: string;
    }

    export interface LighthouseError extends Error {
      friendlyMessage?: string;
    }

    /**
     * A record of DevTools Debugging Protocol events.
     */
    export type DevtoolsLog = Array<Protocol.RawEventMessage>;

    export interface Trace {
      traceEvents: TraceEvent[];
      metadata?: {
        'cpu-family'?: number;
      };
      [futureProps: string]: any;
    }

    /**
     * @see https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
     */
    export interface TraceEvent {
      name: string;
      cat: string;
      args: {
        fileName?: string;
        snapshot?: string;
        data?: {
          documentLoaderURL?: string;
          frames?: {
            frame: string;
            parent?: string;
            processId?: number;
          }[];
          page?: string;
          readyState?: number;
          requestId?: string;
          stackTrace?: {
            url: string
          }[];
          styleSheetUrl?: string;
          timerId?: string;
          url?: string;
        };
        frame?: string;
        name?: string;
        labels?: string;
      };
      pid: number;
      tid: number;
      ts: number;
      dur: number;
      ph: 'B'|'b'|'D'|'E'|'e'|'F'|'I'|'M'|'N'|'n'|'O'|'R'|'S'|'T'|'X';
      s?: 't';
      id?: string;
    }

    export interface DevToolsJsonTarget {
      description: string;
      devtoolsFrontendUrl: string;
      id: string;
      title: string;
      type: string;
      url: string;
      webSocketDebuggerUrl: string;
    }
  }
}
