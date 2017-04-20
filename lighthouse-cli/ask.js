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
const readline = require('readline');
function ask(question, options) {
    return new Promise(resolve => {
        const iface = readline.createInterface(process.stdin, process.stdout);
        const optionsStr = options.map((o, i) => i + 1 + '. ' + o).join('\r\n');
        iface.setPrompt(question + '\r\n' + optionsStr + '\r\nChoice: ');
        iface.prompt();
        iface.on('line', (_answer) => {
            const answer = toInt(_answer);
            if (answer > 0 && answer <= options.length) {
                iface.close();
                resolve(options[answer - 1]);
            }
            else {
                iface.prompt();
            }
        });
    });
}
exports.ask = ask;
function toInt(n) {
    const result = parseInt(n, 10);
    return isNaN(result) ? 0 : result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7R0FlRztBQUVILFlBQVksQ0FBQztBQUViLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUVyQyxhQUFhLFFBQWdCLEVBQUUsT0FBaUI7SUFDOUMsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLE9BQU87UUFDeEIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN0RSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLEdBQUcsTUFBTSxHQUFHLFVBQVUsR0FBRyxjQUFjLENBQUMsQ0FBQztRQUNqRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFZixLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQWU7WUFDL0IsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxJQUFJLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2dCQUMzQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ2QsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMvQixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ04sS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ2pCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQU9PLGtCQUFHO0FBTFgsZUFBZSxDQUFTO0lBQ3RCLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDL0IsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ3BDLENBQUMifQ==