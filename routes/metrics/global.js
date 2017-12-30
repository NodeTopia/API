'use strict';

/**
 * Routes
 */

var restify = require('restify');
var request = require('request');
var async = require('async');
var querystring = require('querystring');
var routes = [];

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */
function buildQuery(target, query) {

	return 'http://192.168.1.43:31843/render/?' + querystring.stringify({
		target : target,
		from : query.from || '-25min',
		until : query.until || '-1min',
		format : query.format || 'json',
		maxDataPoints : 3000
	});
}

function getMetrics(target, query, cb) {
	request({
		url : buildQuery(target, query)
	}, function callback(error, response, body) {
		if (!error && response.statusCode == 200) {
			cb(null, JSON.parse(body));
		} else {
			cb(error);
		}
	});
}

routes.push({
	meta : {
		method : 'GET',
		paths : ['/metrics'],
		version : '1.0.0',
		auth : true,
	},
	middleware : function(req, res, next) {

		req.mongoose.Organization.find({
			'membership.user' : req.user._id
		}, 'metricSession', function(err, organizations) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			var targets = {
				'http-rate' : function(next) {
					getMetrics("alias(summarize(transformNull(sumSeries(stats.counters.http.*.*.count), 0), '30s', 'sum', false), 'Global HTTP Rate')", req.query, next);
				},
				'user-http-rate' : function(next) {
					//
					getMetrics("alias(transformNull(sumSeries(summarize(stats.counters.http.{" + organizations.map(function(org) {
						return org.metricSession
					}) + "}.*.count, '30s', 'sum', false)), 0), 'User HTTP Rate')", req.query, next);
				},
			};
			var query = {};

			if (req.query.target) {
				if (Array.isArray(req.query.target)) {
					req.query.target.forEach(function(target) {
						if (targets[target]) {
							query[target] = targets[target];
						}
					});
				} else {
					query[req.query.target] = targets[req.query.target];
				}
			} else {
				if (targets[query]) {
					query = targets;
				}
			}

			async.parallel(query, function(err, results) {

				res.json({
					status : "success",
					metrics : results
				}, 200);
			});
		});
	}
});
/**
 * Export
 */

module.exports = routes;
