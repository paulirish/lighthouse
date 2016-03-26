/**
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

class ThemeColor {

  static get tags() {
    return ['HTML'];
  }

  static get description() {
    return 'Site has a theme-color meta tag';
  }

  static audit(inputs) {
    let hasThemeColor = false;
    if (inputs.window) {
      const themeColorElements =
        inputs.window.document.querySelectorAll('head meta[name="theme-color"]');

      if (themeColorElements.length === 1 &&
        themeColorElements[0].getAttribute('content').length > 0) {
        hasThemeColor = true;
      }
    }

    return {
      value: hasThemeColor,
      tags: ThemeColor.tags,
      description: ThemeColor.description
    };
  }
}

module.exports = ThemeColor;
