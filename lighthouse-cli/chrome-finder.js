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
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const execFileSync = require('child_process').execFileSync;
const newLineRegex = /\r?\n/;
function darwin() {
    const suffixes = [
        '/Contents/MacOS/Google Chrome Canary',
        '/Contents/MacOS/Google Chrome'
    ];
    const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
        '/Versions/A/Frameworks/LaunchServices.framework' +
        '/Versions/A/Support/lsregister';
    const installations = [];
    execSync(`${LSREGISTER} -dump` +
        ' | grep -i \'google chrome\\( canary\\)\\?.app$\'' +
        ' | awk \'{$1=""; print $0}\'').toString()
        .split(newLineRegex)
        .forEach((inst) => {
        suffixes.forEach(suffix => {
            const execPath = path.join(inst.trim(), suffix);
            if (canAccess(execPath)) {
                installations.push(execPath);
            }
        });
    });
    const priorities = [{
            regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome.app`),
            weight: 50
        }, {
            regex: new RegExp(`^${process.env.HOME}/Applications/.*Chrome Canary.app`),
            weight: 51
        }, {
            regex: /^\/Applications\/.*Chrome.app/,
            weight: 100
        }, {
            regex: /^\/Applications\/.*Chrome Canary.app/,
            weight: 101
        }, {
            regex: /^\/Volumes\/.*Chrome.app/,
            weight: -2
        }, {
            regex: /^\/Volumes\/.*Chrome Canary.app/,
            weight: -1
        }];
    return sort(installations, priorities);
}
exports.darwin = darwin;
/**
 * Look for linux executables in 3 ways
 * 1. Look into LIGHTHOUSE_CHROMIUM_PATH env variable
 * 2. Look into the directories where .desktop are saved on gnome based distro's
 * 3. Look for google-chrome-stable & google-chrome executables by using the which command
 */
function linux() {
    let installations = [];
    // 1. Look into LIGHTHOUSE_CHROMIUM_PATH env variable
    if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
        installations.push(process.env.LIGHTHOUSE_CHROMIUM_PATH);
    }
    // 2. Look into the directories where .desktop are saved on gnome based distro's
    const desktopInstallationFolders = [
        path.join(require('os').homedir(), '.local/share/applications/'),
        '/usr/share/applications/',
    ];
    desktopInstallationFolders.forEach(folder => {
        installations = installations.concat(findChromeExecutables(folder));
    });
    // Look for google-chrome-stable & google-chrome executables by using the which command
    const executables = [
        'google-chrome-stable',
        'google-chrome',
    ];
    executables.forEach((executable) => {
        try {
            const chromePath = execFileSync('which', [executable])
                .toString()
                .split(newLineRegex)[0];
            if (canAccess(chromePath)) {
                installations.push(chromePath);
            }
        }
        catch (e) {
        }
    });
    if (!installations.length) {
        throw new Error('The environment variable LIGHTHOUSE_CHROMIUM_PATH must be set to ' +
            'executable of a build of Chromium version 54.0 or later.');
    }
    const priorities = [{
            regex: /chrome-wrapper$/,
            weight: 51
        }, {
            regex: /google-chrome-stable$/,
            weight: 50
        }, {
            regex: /google-chrome$/,
            weight: 49
        }, {
            regex: new RegExp(process.env.LIGHTHOUSE_CHROMIUM_PATH),
            weight: 100
        }];
    return sort(uniq(installations.filter(Boolean)), priorities);
}
exports.linux = linux;
function win32() {
    const installations = [];
    const suffixes = [
        '\\Google\\Chrome SxS\\Application\\chrome.exe',
        '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const prefixes = [
        process.env.LOCALAPPDATA,
        process.env.PROGRAMFILES,
        process.env['PROGRAMFILES(X86)']
    ];
    if (canAccess(process.env.LIGHTHOUSE_CHROMIUM_PATH)) {
        installations.push(process.env.LIGHTHOUSE_CHROMIUM_PATH);
    }
    prefixes.forEach(prefix => suffixes.forEach(suffix => {
        const chromePath = path.join(prefix, suffix);
        if (canAccess(chromePath)) {
            installations.push(chromePath);
        }
    }));
    return installations;
}
exports.win32 = win32;
function sort(installations, priorities) {
    const defaultPriority = 10;
    return installations
        .map((inst) => {
        for (const pair of priorities) {
            if (pair.regex.test(inst)) {
                return [inst, pair.weight];
            }
        }
        return [inst, defaultPriority];
    })
        .sort((a, b) => b[1] - a[1])
        .map(pair => pair[0]);
}
function canAccess(file) {
    if (!file) {
        return false;
    }
    try {
        fs.accessSync(file);
        return true;
    }
    catch (e) {
        return false;
    }
}
function uniq(arr) {
    return Array.from(new Set(arr));
}
function findChromeExecutables(folder) {
    const argumentsRegex = /(^[^ ]+).*/; // Take everything up to the first space
    const chromeExecRegex = '^Exec=\/.*\/(google|chrome|chromium)-.*';
    let installations = [];
    if (canAccess(folder)) {
        // Output of the grep & print looks like:
        //    /opt/google/chrome/google-chrome --profile-directory
        //    /home/user/Downloads/chrome-linux/chrome-wrapper %U
        let execPaths = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`)
            .toString()
            .split(newLineRegex)
            .map((execPath) => execPath.replace(argumentsRegex, '$1'));
        execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath));
    }
    return installations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hyb21lLWZpbmRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNocm9tZS1maW5kZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBRUgsWUFBWSxDQUFDO0FBRWIsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM3QixNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxDQUFDO0FBQ25ELE1BQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxZQUFZLENBQUM7QUFFM0QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDO0FBSTdCO0lBQ0UsTUFBTSxRQUFRLEdBQUc7UUFDZixzQ0FBc0M7UUFDdEMsK0JBQStCO0tBQ2hDLENBQUM7SUFFRixNQUFNLFVBQVUsR0FDZCxtREFBbUQ7UUFDbkQsaURBQWlEO1FBQ2pELGdDQUFnQyxDQUFDO0lBRW5DLE1BQU0sYUFBYSxHQUFrQixFQUFFLENBQUM7SUFFeEMsUUFBUSxDQUNOLEdBQUcsVUFBVSxRQUFRO1FBQ3JCLG1EQUFtRDtRQUNuRCw4QkFBOEIsQ0FDL0IsQ0FBQyxRQUFRLEVBQUU7U0FDVCxLQUFLLENBQUMsWUFBWSxDQUFDO1NBQ25CLE9BQU8sQ0FBQyxDQUFDLElBQVk7UUFDcEIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ3JCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDL0IsQ0FBQztRQUNILENBQUMsQ0FBQyxD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