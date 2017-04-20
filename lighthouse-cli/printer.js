/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
/**
 * An enumeration of acceptable output modes:
 *   'json': JSON formatted results
 *   'html': An HTML report
 *   'domhtml': An HTML report rendered client-side with DOM elements
 */
var OutputMode;
(function (OutputMode) {
    OutputMode[OutputMode["json"] = 0] = "json";
    OutputMode[OutputMode["html"] = 1] = "html";
    OutputMode[OutputMode["domhtml"] = 2] = "domhtml";
})(OutputMode || (OutputMode = {}));
exports.OutputMode = OutputMode;
;
const fs = require('fs');
const ReportGenerator = require('../lighthouse-core/report/report-generator');
const ReportGeneratorV2 = require('../lighthouse-core/report/v2/report-generator');
const log = require('../lighthouse-core/lib/log');
/**
 * Verify output path to use, either stdout or a file path.
 */
function checkOutputPath(path) {
    if (!path) {
        log.warn('Printer', 'No output path set; using stdout');
        return 'stdout';
    }
    return path;
}
exports.checkOutputPath = checkOutputPath;
/**
 * Creates the results output in a format based on the `mode`.
 */
function createOutput(results, outputMode) {
    const reportGenerator = new ReportGenerator();
    // HTML report.
    if (outputMode === OutputMode.html) {
        return reportGenerator.generateHTML(results, 'cli');
    }
    if (outputMode === OutputMode.domhtml) {
        return new ReportGeneratorV2().generateReportHtml(results);
    }
    // JSON report.
    if (outputMode === OutputMode.json) {
        return JSON.stringify(results, null, 2);
    }
    throw new Error('Invalid output mode: ' + outputMode);
}
exports.createOutput = createOutput;
/* istanbul ignore next */
/**
 * Writes the output to stdout.
 */
function writeToStdout(output) {
    return new Promise(resolve => {
        // small delay to avoid race with debug() logs
        setTimeout(_ => {
            process.stdout.write(`${output}\n`);
            resolve();
        }, 50);
    });
}
/**
 * Writes the output to a file.
 */
function writeFile(filePath, output, outputMode) {
    return new Promise((resolve, reject) => {
        // TODO: make this mkdir to the filePath.
        fs.writeFile(filePath, output, 'utf8', (err) => {
            if (err) {
                return reject(err);
            }
            log.log('Printer', `${OutputMode[outputMode]} output written to ${filePath}`);
            resolve();
        });
    });
}
/**
 * Writes the results.
 */
function write(results, mode, path) {
    return new Promise((resolve, reject) => {
        const outputPath = checkOutputPath(path);
        const output = createOutput(results, OutputMode[mode]);
        // Testing stdout is out of scope, and doesn't really achieve much besides testing Node,
        // so we will skip this chunk of the code.
        /* istanbul ignore if */
        if (outputPath === 'stdout') {
            return writeToStdout(output).then(_ => resolve(results));
        }
        return writeFile(outputPath, output, OutputMode[mode]).then(_ => {
            resolve(results);
        }).catch(err => reject(err));
    });
}
exports.write = write;
function GetValidOutputOptions() {
    return [OutputMode[OutputMode.json],
        OutputMode[OutputMode.html],
        OutputMode[OutputMode.domhtml]];
}
exports.GetValidOutputOptions = GetValidOutputOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInByaW50ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBRUgsWUFBWSxDQUFDO0FBRWI7Ozs7O0dBS0c7QUFDSCxJQUFLLFVBQWtDO0FBQXZDLFdBQUssVUFBVTtJQUFHLDJDQUFJLENBQUE7SUFBRSwyQ0FBSSxDQUFBO0lBQUUsaURBQU8sQ0FBQTtBQUFDLENBQUMsRUFBbEMsVUFBVSxLQUFWLFVBQVUsUUFBd0I7QUE0R3JDLGdDQUFVO0FBNUcyQixDQUFDO0FBS3hDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsNENBQTRDLENBQUMsQ0FBQztBQUM5RSxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO0FBQ25GLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBR2xEOztHQUVHO0FBQ0gseUJBQXlCLElBQVk7SUFDbkMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ1YsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztRQUN4RCxNQUFNLENBQUMsUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQW9GQywwQ0FBZTtBQWxGakI7O0dBRUc7QUFDSCxzQkFBc0IsT0FBZ0IsRUFBRSxVQUFzQjtJQUM1RCxNQUFNLGVBQWUsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO0lBRTlDLGVBQWU7SUFDZixFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDbkMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdEMsTUFBTSxDQUFDLElBQUksaUJBQWlCLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsZUFBZTtJQUNmLEVBQUUsQ0FBQyxDQUFDLFVBQVUsS0FBSyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNuQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixHQUFHLFVBQVUsQ0FBQyxDQUFDO0FBQ3hELENBQUM7QUE4REMsb0NBQVk7QUE1RGQsMEJBQTBCO0FBQzFCOztHQUVHO0FBQ0gsdUJBQXVCLE1BQWM7SUFDbkMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87UUFDeEIsOENBQThDO1FBQzlDLFVBQVUsQ0FBQyxDQUFDO1lBQ1YsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1QsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxtQkFBbUIsUUFBZ0IsRUFBRSxNQUFjLEVBQUUsVUFBc0I7SUFDekUsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU07UUFDakMseUNBQXlDO1FBQ3pDLEVBQUUsQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFVO1lBQ2hELEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ1IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNyQixDQUFDO1lBQ0QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLHNCQUFzQixRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRDs7R0FFRztBQUNILGVBQWUsT0FBZ0IsRUFBRSxJQUFVLEVBQUUsSUFBWTtJQUN2RCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTTtRQUNqQyxNQUFNLFVBQVUsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFekMsTUFBTSxNQUFNLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBUSxVQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUU5RCx3RkFBd0Y7UUFDeEYsMENBQTBDO1FBQzFDLHdCQUF3QjtRQUN4QixFQUFFLENBQUMsQ0FBQyxVQUFVLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQztRQUVELE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLE1BQU0sRUFBUSxVQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNsRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFXQyxzQkFBSztBQVRQO0lBQ0UsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQVM7UUFDbkMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQVM7UUFDbkMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQVMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFPQyxzREFBcUIifQ==