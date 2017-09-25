/**
 * @license Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

class ComputedArtifact {
  /**
   * @param {!ComputedArtifacts} allComputedArtifacts
   */
  constructor(allComputedArtifacts) {
    /** @private {!Map} */
    this._cache = new Map();

    /** @private {!ComputedArtifacts} */
    this._allComputedArtifacts = allComputedArtifacts;
  }

  get requiredNumberOfArtifacts() {
    return 1;
  }

  /* eslint-disable no-unused-vars */

  /**
   * Override to implement a computed artifact. Can return a Promise or the
   * computed artifact itself.
   * @param {*} artifact Input to computation.
   * @param {!ComputedArtifacts} allComputedArtifacts Access to all computed artifacts.
   * @return {*}
   * @throws {Error}
   */
  compute_(artifact, allComputedArtifacts) {
    throw new Error('compute_() not implemented for computed artifact ' + this.name);
  }

  /**
   * This is a helper function for performing cache operations and is responsible for maintaing the
   * internal cache structure. This function accepts a path of artifacts, used to find the correct
   * nested cache object, and an operation to perform on that cache with the final key.
   *
   * The cache is structured with the first argument occupying the keys of the toplevel cache that point
   * to the Map of keys for the second argument and so forth until the 2nd to last argument's Map points
   * to result values rather than further nesting. In the simplest case of a single argument, there
   * is no nesting and the keys point directly to result values.
   *
   *  Map(
   *    argument1A -> Map(
   *      argument2A -> result1A2A
   *      argument2B -> result1A2B
   *    )
   *    argument1B -> Map(
   *      argument2A -> result1B2A
   *    )
   *  )
   *
   * @param {!Array<*>} artifacts
   * @param {function(!Map, *)} cacheOperation
   */
  _performCacheOperation(artifacts, cacheOperation) {
    artifacts = artifacts.slice();

    let cache = this._cache;
    while (artifacts.length > 1) {
      const nextKey = artifacts.shift();
      if (cache.has(nextKey)) {
        cache = cache.get(nextKey);
      } else {
        const nextCache = new Map();
        cache.set(nextKey, nextCache);
        cache = nextCache;
      }
    }

    return cacheOperation(cache, artifacts.shift());
  }

  /**
   * Performs a cache.has operation, see _performCacheOperation for more.
   * @param {!Array<*>} artifacts
   * @return {boolean}
   */
  _cacheHas(artifacts) {
    return this._performCacheOperation(artifacts, (cache, key) => cache.has(key));
  }

  /**
   * Performs a cache.get operation, see _performCacheOperation for more.
   * @param {!Array<*>} artifacts
   * @return {*}
   */
  _cacheGet(artifacts) {
    return this._performCacheOperation(artifacts, (cache, key) => cache.get(key));
  }

  /**
   * Performs a cache.set operation, see _performCacheOperation for more.
   * @param {!Array<*>} artifacts
   * @param {*} result
   */
  _cacheSet(artifacts, result) {
    return this._performCacheOperation(artifacts, (cache, key) => cache.set(key, result));
  }

  /**
   * Asserts that the length of the array is the same as the number of inputs the class expects
   * @param {!Array<*>} artifacts
   */
  _assertCorrectNumberOfArtifacts(artifacts) {
    const actual = artifacts.length;
    const expected = this.requiredNumberOfArtifacts;
    if (actual !== expected) {
      const className = this.constructor.name;
      throw new Error(`${className} requires ${expected} artifacts but ${actual} were given`);
    }
  }

  /* eslint-enable no-unused-vars */

  /**
   * Request a computed artifact, caching the result on the input artifact.
   * @param {...*} artifacts
   * @return {!Promise<*>}
   */
  request(...artifacts) {
    this._assertCorrectNumberOfArtifacts(artifacts);
    if (this._cacheHas(artifacts)) {
      return Promise.resolve(this._cacheGet(artifacts));
    }

    const artifactPromise = Promise.resolve().then(_ =>
      this.compute_(...artifacts, this._allComputedArtifacts)
    );
    this._cacheSet(artifacts, artifactPromise);

    return artifactPromise;
  }
}

module.exports = ComputedArtifact;
