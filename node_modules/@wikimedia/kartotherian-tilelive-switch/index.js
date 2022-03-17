"use strict";
const async = require('async');
const LoadBalancer = require('./lib/LoadBalance');

/**
 * This module works like a middleware to a specified source and
 * requests resource from a mirrored source with no-op callbacks
 *
 * Reason: this is useful for pre-production tests with new services
 * to observe behaviour with production load before release
 *
 * @param tilelive
 * @param options
 * @returns {Switch}
 */
module.exports = function (tilelive, options) {
    const Switch = function (uri, callback) {
        const self = this;
        const lbOptions = uri.query.loadBalancer || {};

        switch (uri.protocol) {
            case "switch:":
                self.enableSwitch = uri.query.enableSwitch || false;
                self.enableMirror = false;
                break;
            case "mirror:":
                self.enableMirror = uri.query.enableMirror || false;
                self.enableSwitch = false;
                break;
            default:
                throw Error(`Unrecognized protocol ${uri.protocol}`);
                break;
        }

        self.lb = new LoadBalancer(lbOptions);

        async.waterfall([
            async.apply(tilelive.load, uri.query.source),
            (tlsource, done) => {
                self.source = tlsource;
                done();
            },
            async.apply(tilelive.load, uri.query.secondarySource),
            (secondarySource, done) => {
                self.secondarySource = secondarySource;
                done();
            }
        ], () => {
            return callback(null, self);
        });
    }

    Switch.prototype._mirroredGetTile = function (z, x, y, callback) {
        if (this.lb.enableSecondaryLoad()) {
            // Request the mirrored tile with no-op callback
            this.secondarySource.getTile(z, x, y, () => {});
        }
        this.source.getTile(z, x, y, callback);
    }

    Switch.prototype._switchGetTile = function (z, x, y, callback) {
        if (this.lb.enableSecondaryLoad()) {
            this.secondarySource.getTile(z, x, y, callback);
        } else {
            this.source.getTile(z, x, y, callback);
        }
    }

    Switch.prototype.getTile = function(z, x, y, callback) {
        if (this.enableMirror) {
            this._mirroredGetTile(z, x, y, callback);
        } else if (this.enableSwitch) {
            this._switchGetTile(z, x, y, callback);
        } else {
            this.source.getTile(z, x, y, callback)
        }
    }

    Switch.prototype.getInfo = function(callback) {
        // Ignore mirror source info
        this.source.getInfo(callback);
    }
    Switch.prototype.close = function(callback) {
        return callback && setImmediate(callback);
    }
    Switch.registerProtocols = function(tilelive) {
        tilelive.protocols["switch:"] = Switch;
        tilelive.protocols["mirror:"] = Switch;
    }

    Switch.registerProtocols(tilelive);

    return Switch;
}
