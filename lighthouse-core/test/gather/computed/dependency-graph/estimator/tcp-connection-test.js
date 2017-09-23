/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

// eslint-disable-next-line
const TcpConnection = require('../../../../../gather/computed/dependency-graph/estimator/tcp-connection');

const assert = require('assert');

/* eslint-env mocha */
describe('DependencyGraph/Estimator/TcpConnection', () => {
  describe('#constructor', () => {
    it('should create the connection', () => {
      const rtt = 150;
      const throughput = 1600 * 1024;
      const connection = new TcpConnection(rtt, throughput);
      assert.ok(connection);
      assert.equal(connection._rtt, rtt);
    });
  });

  describe('#maximumSaturatedConnections', () => {
    it('should compute number of supported simulated requests', () => {
      const availableThroughput = 1460 * 8 * 10; // 10 TCP segments/second
      assert.equal(TcpConnection.maximumSaturatedConnections(100, availableThroughput), 1);
      assert.equal(TcpConnection.maximumSaturatedConnections(300, availableThroughput), 3);
      assert.equal(TcpConnection.maximumSaturatedConnections(1000, availableThroughput), 10);
    });
  });

  describe('.setWarmed', () => {
    it('adjusts the time to download appropriately', () => {
      const connection = new TcpConnection(100, Infinity);
      assert.equal(connection.simulateDownloadUntil(0).timeElapsed, 300);
      connection.setWarmed(true);
      assert.equal(connection.simulateDownloadUntil(0).timeElapsed, 100);
    });
  });

  describe('.setCongestionWindow', () => {
    it('adjusts the time to download appropriately', () => {
      const connection = new TcpConnection(100, Infinity);
      assert.deepEqual(connection.simulateDownloadUntil(50000), {
        bytesDownloaded: 50000,
        congestionWindow: 40,
        roundTrips: 5,
        timeElapsed: 500,
      });
      connection.setCongestionWindow(80); // will download all in one round trip
      assert.deepEqual(connection.simulateDownloadUntil(50000), {
        bytesDownloaded: 50000,
        congestionWindow: 80,
        roundTrips: 3,
        timeElapsed: 300,
      });
    });
  });

  describe('.simulateDownloadUntil', () => {
    context('when maximumTime is not set', () => {
      it('should provide the correct values small payload non-SSL', () => {
        const connection = new TcpConnection(100, Infinity, 0, false);
        assert.deepEqual(connection.simulateDownloadUntil(7300), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 2,
          timeElapsed: 200,
        });
      });

      it('should provide the correct values small payload SSL', () => {
        const connection = new TcpConnection(100, Infinity, 0, true);
        assert.deepEqual(connection.simulateDownloadUntil(7300), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 3,
          timeElapsed: 300,
        });
      });

      it('should provide the correct values response time', () => {
        const responseTime = 78;
        const connection = new TcpConnection(100, Infinity, responseTime, true);
        assert.deepEqual(connection.simulateDownloadUntil(7300), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 3,
          timeElapsed: 300 + responseTime,
        });
      });

      it('should provide the correct values large payload', () => {
        const connection = new TcpConnection(100, 8 * 1000 * 1000);
        const bytesToDownload = 10 * 1000 * 1000; // 10 mb
        assert.deepEqual(connection.simulateDownloadUntil(bytesToDownload), {
          bytesDownloaded: bytesToDownload,
          congestionWindow: 68,
          roundTrips: 105,
          timeElapsed: 10500,
        });
      });

      it('should provide the correct values resumed small payload', () => {
        const connection = new TcpConnection(100, Infinity, 0, true);
        assert.deepEqual(connection.simulateDownloadUntil(7300, 250), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 3,
          timeElapsed: 50,
        });
      });

      it('should provide the correct values resumed large payload', () => {
        const connection = new TcpConnection(100, 8 * 1000 * 1000);
        const bytesToDownload = 5 * 1000 * 1000; // 5 mb
        connection.setCongestionWindow(68);
        assert.deepEqual(connection.simulateDownloadUntil(bytesToDownload, 5234), {
          bytesDownloaded: bytesToDownload,
          congestionWindow: 68,
          roundTrips: 51, // 5 mb / (1460 * 68)
          timeElapsed: 5100,
        });
      });
    });

    context('when maximumTime is set', () => {
      it('should provide the correct values less than TTFB', () => {
        const connection = new TcpConnection(100, Infinity, 0, false);
        assert.deepEqual(connection.simulateDownloadUntil(7300, 0, 68), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 2,
          timeElapsed: 200,
        });
      });

      it('should provide the correct values just over TTFB', () => {
        const connection = new TcpConnection(100, Infinity, 0, false);
        assert.deepEqual(connection.simulateDownloadUntil(7300, 0, 250), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 2,
          timeElapsed: 200,
        });
      });

      it('should provide the correct values with already elapsed', () => {
        const connection = new TcpConnection(100, Infinity, 0, false);
        assert.deepEqual(connection.simulateDownloadUntil(7300, 75, 250), {
          bytesDownloaded: 7300,
          congestionWindow: 10,
          roundTrips: 2,
          timeElapsed: 125,
        });
      });

      it('should provide the correct values large payloads', () => {
        const connection = new TcpConnection(100, 8 * 1000 * 1000);
        const bytesToDownload = 10 * 1000 * 1000; // 10 mb
        assert.deepEqual(connection.simulateDownloadUntil(bytesToDownload, 500, 740), {
          bytesDownloaded: 683280, // should be less than 68 * 1460 * 8
          congestionWindow: 68,
          roundTrips: 8,
          timeElapsed: 800, // skips the handshake because time already elapsed
        });
      });

      it('should all add up', () => {
        const connection = new TcpConnection(100, 8 * 1000 * 1000);
        const bytesToDownload = 10 * 1000 * 1000; // 10 mb
        const firstStoppingPoint = 5234;
        const secondStoppingPoint = 315;
        const thirdStoppingPoint = 10500 - firstStoppingPoint - secondStoppingPoint;

        const firstSegment = connection.simulateDownloadUntil(
            bytesToDownload,
            0,
            firstStoppingPoint
        );
        const firstOvershoot = firstSegment.timeElapsed - firstStoppingPoint;

        connection.setCongestionWindow(firstSegment.congestionWindow);
        const secondSegment = connection.simulateDownloadUntil(
            bytesToDownload - firstSegment.bytesDownloaded,
            firstSegment.timeElapsed,
            secondStoppingPoint - firstOvershoot
        );
        const secondOvershoot = firstOvershoot + secondSegment.timeElapsed - secondStoppingPoint;

        connection.setCongestionWindow(secondSegment.congestionWindow);
        const thirdSegment = connection.simulateDownloadUntil(
            bytesToDownload - firstSegment.bytesDownloaded - secondSegment.bytesDownloaded,
            firstSegment.timeElapsed + secondSegment.timeElapsed
        );
        const thirdOvershoot = secondOvershoot + thirdSegment.timeElapsed - thirdStoppingPoint;

        assert.equal(thirdOvershoot, 0);
        assert.equal(
            firstSegment.bytesDownloaded +
                secondSegment.bytesDownloaded +
                thirdSegment.bytesDownloaded,
            bytesToDownload
        );
        assert.equal(
            firstSegment.timeElapsed + secondSegment.timeElapsed + thirdSegment.timeElapsed,
            10500
        );
      });
    });
  });
});
