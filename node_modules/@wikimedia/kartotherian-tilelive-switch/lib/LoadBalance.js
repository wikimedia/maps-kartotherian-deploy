"use strict";

const PRIMARY_LOAD = 0;
const SECONDARY_LOAD = 1;

const LoadBalance = function(options = {}) {
    // default behaviour is no-throttle
    this.threshold = options.threshold || 1;
    // last time checkpoint: initial value current timestamp
    this.lastCheckpoint = Date.now();
    // bucket size in milliseconds
    this.bucketSize = options.bucketSize || 1000;
    this.totalBuckets = options.totalBuckets || 10;
    this.histograms = [];
    this.histograms[PRIMARY_LOAD] = this._initialHistogram();
    this.histograms[SECONDARY_LOAD] = this._initialHistogram();
}

/**
 * Initial histogram array
 * @returns {[number]}
 * @private
 */
LoadBalance.prototype._initialHistogram = function() {
    return [0];
}

/**
 * Calculate the histogram average
 * @param loadIndex
 * @returns {number}
 * @private
 */
LoadBalance.prototype._histogramAverage = function(loadIndex = PRIMARY_LOAD) {
    const totalCounts = this.histograms[loadIndex].reduce((sum, counter) => {
        return sum + counter;
    }, 0);
    return totalCounts / this.histograms[loadIndex].length;
}

/**
 * Shrink idle end of the histogram to improve average accuracy
 * @param loadIndex
 * @private
 */
LoadBalance.prototype._shrinkIdleHistogram = function(loadIndex = PRIMARY_LOAD) {
    const length = this.histograms[loadIndex].length
    while (
        this.histograms[loadIndex][length - 1] === 0 &&
        length > 1
        ) {
        this.histograms[loadIndex].pop();
    }
}

/**
 * Returns the ammount of buckets to rotate
 * @private
 */
LoadBalance.prototype._getNumberOfBucketsToRotate = function(currentCheckpoint) {
    return Math.trunc((currentCheckpoint - this.lastCheckpoint) / this.bucketSize);
}

/**
 * Rotate buckets accordingly with last time checkpoint
 * Always shrink the idle end of the histogram
 * @param loadIndex
 * @private
 */
LoadBalance.prototype._rotateBuckets = function(loadIndex = PRIMARY_LOAD, currentCheckpoint) {
    const numOfBuckets =  this._getNumberOfBucketsToRotate(currentCheckpoint);
    if (numOfBuckets >= this.totalBuckets) {
        this.histograms[loadIndex] = this._initialHistogram();
    } else {
        for (let i = 0; i < numOfBuckets; i++) {
            this.histograms[loadIndex].unshift(0);
            if (this.histograms[loadIndex].length > this.totalBuckets) {
                this.histograms[loadIndex].pop();
            }
            this._shrinkIdleHistogram(loadIndex);
        }
    }
}

/**
 * Increment current bucket of time
 * @param loadIndex
 * @private
 */
LoadBalance.prototype._incrementBucket = function(loadIndex = PRIMARY_LOAD) {
    this.histograms[loadIndex][0] += 1;
}

/**
 * Return true or false if the secondary load can be enabled in case there is some throttling
 * being applied
 * @returns {boolean}
 */
LoadBalance.prototype.enableSecondaryLoad = function() {
    if (this.threshold === 1) {
        // no throttling
        return true;
    }

    const currentCheckpoint = Date.now();
    if (currentCheckpoint - this.lastCheckpoint > this.bucketSize) {
        this._rotateBuckets(PRIMARY_LOAD, currentCheckpoint);
        this._rotateBuckets(SECONDARY_LOAD, currentCheckpoint);
        this.lastCheckpoint = currentCheckpoint;
    }

    this._incrementBucket(PRIMARY_LOAD);
    if (!this._isSecondaryLoadAboveThreshold()) {
        this._incrementBucket(SECONDARY_LOAD);
        return true;
    }
    return false;
}

/**
 * Check if the secondary load average is above the threshold in case there is some throttling
 * being applied
 * @returns {boolean}
 * @private
 */
LoadBalance.prototype._isSecondaryLoadAboveThreshold = function () {
    // return true or false if the secondary load histogram average is above the threshold
    return this._histogramAverage(SECONDARY_LOAD) >= this._histogramAverage(PRIMARY_LOAD) * this.threshold;
}

module.exports = LoadBalance;
