/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import _Crdp from '../node_modules/vscode-chrome-debug-core/lib/crdp/crdp';
import _StrictEventEmitter from '../third-party/strict-event-emitter-types/index';
import { EventEmitter } from 'events';

declare global {
  // Augment global Error type to include node's optional `code` property
  // see https://nodejs.org/api/errors.html#errors_error_code
  interface Error {
    code?: string;
  }

  /** Make properties K in T optional. */
  type MakeOptional<T, K extends keyof T> = {
    [P in Exclude<keyof T, K>]: T[P]
  } & {
    [P in K]+?: T[P]
  }

  /** Remove properties K from T. */
  type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

  /** Obtain the type of the first parameter of a function. */
  type FirstParamType<T extends (arg1: any, ...args: any[]) => any> =
    T extends (arg1: infer P, ...args: any[]) => any ? P : any;

  module LH {
    // re-export useful type modules under global LH module.
    export import Crdp = _Crdp;
    export type StrictEventEmitter<TEventRecord, TEmitterType = EventEmitter, TEmitRecord = TEventRecord> =
      _StrictEventEmitter<TEmitterType, TEventRecord, TEmitRecord>;

    interface ThrottlingSettings {
      // simulation settings
      rttMs?: number;
      throughputKbps?: number;
      // devtools settings
      requestLatencyMs?: number;
      downloadThroughputKbps?: number;
      uploadThroughputKbps?: number;
      // used by both
      cpuSlowdownMultiplier?: number
    }

    export type OutputMode = 'json' | 'html' | 'csv';

    interface SharedFlagsSettings {
      output?: OutputMode|OutputMode[];
      maxWaitForLoad?: number;
      blockedUrlPatterns?: string[] | null;
      additionalTraceCategories?: string | null;
      auditMode?: boolean | string;
      gatherMode?: boolean | string;
      disableStorageReset?: boolean;
      disableDeviceEmulation?: boolean;
      throttlingMethod?: 'devtools'|'simulate'|'provided';
      throttling?: ThrottlingSettings;
      onlyAudits?: string[] | null;
      onlyCategories?: string[] | null;
      skipAudits?: string[] | null;
    }

    export interface Flags extends SharedFlagsSettings {
      _: string[];
      port: number;
      chromeFlags: string;
      output: any;
      outputPath: string;
      saveAssets: boolean;
      view: boolean;
      logLevel: string;
      hostname: string;
      enableErrorReporting: boolean;
      listAllAudits: boolean;
      listTraceCategories: boolean;
      configPath?: string;
      preset?: 'full'|'mixed-content'|'perf';
      perf: boolean;
      mixedContent: boolean;
      verbose: boolean;
      quiet: boolean;

      extraHeaders?: string;
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

    export interface LaunchedChrome {
      pid: number;
      port: number;
      kill: () => Promise<{}>;
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
        data?: {
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
      };
      pid: number;
      tid: number;
      ts: number;
      dur?: number;
      ph: 'B'|'b'|'D'|'E'|'e'|'F'|'I'|'M'|'N'|'n'|'O'|'R'|'S'|'T'|'X';
      s?: 't';
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
