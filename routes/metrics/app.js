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
		from : query.from || '-12hours',
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
		paths : ['/organization/:organization/apps/:name/metrics', '/apps/:name/metrics'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;

		var summarize = req.query.summarize || '1min'

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, 'domains', function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Container.find({
				reference : app._id,
				state : 'RUNNING',
				type : {
					$nin : ['build']
				}
			}, 'type config.index config.name config.channel', function(err, containers) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				req.query.interval = 60
				var targets = {
					'http-rate' : function(next) {
						getMetrics("aliasByNode(summarize(transformNull(stats.counters.http." + req.organization.metricSession + ".{" + app.domains.map(function(domain) {
							return domain.url.split('.').join('_')
						}).join() + "}.count, 0), '"+summarize+"', 'sum', false), 4)", req.query, next);

					},
					'http-total' : function(next) {
						getMetrics("alias(sumSeries(summarize(transformNull(stats.counters.http." + req.organization.metricSession + ".{" + app.domains.map(function(domain) {
							return domain.url.split('.').join('_');
						}).join() + "}.count, 0), '1month', 'sum', false)), 'Total req')", req.query, next);

					},
					'http-time-upper' : function(next) {
						getMetrics("alias(sumSeries(summarize(transformNull(scaleToSeconds(stats.timers.http." + req.organization.metricSession + ".{" + app.domains.map(function(domain) {
							return domain.url.split('.').join('_');
						}).join() + "}.upper_95, 60), 0), '"+summarize+"', 'avg', false)), 'Upper 95%')", req.query, next);

					},
					'http-time-lower' : function(next) {
						getMetrics("alias(sumSeries(summarize(transformNull(scaleToSeconds(stats.timers.http." + req.organization.metricSession + ".{" + app.domains.map(function(domain) {
							return domain.url.split('.').join('_');
						}).join() + "}.lower, 60), 0), '"+summarize+"', 'avg', false)), 'lower')", req.query, next);

					},
					'http-time-mean' : function(next) {
						getMetrics("alias(sumSeries(summarize(transformNull(scaleToSeconds(stats.timers.http." + req.organization.metricSession + ".{" + app.domains.map(function(domain) {
							return domain.url.split('.').join('_');
						}).join() + "}.mean_95, 60), 0), '"+summarize+"', 'avg', false)), 'Mean 95%')", req.query, next);

					},
					'processes-tx_bytes' : function(next) {
						getMetrics("aliasByNode(summarize(transformNull(scaleToSeconds(stats.counters." + req.organization.metricSession + "." + req.organization.name + "." + name + ".{" + containers.map(function(container) {
							return container.config.name.split('.').pop()
						}) + "}.{" + containers.map(function(container) {
							return container.config.channel.split('.')[1]
						}) + "}.networks.eth0.tx_bytes.count, 60), 0), '"+summarize+"', 'avg', false),5,6,9))", req.query, next);

					},
					'processes-rx_bytes' : function(next) {

						getMetrics("aliasByNode(summarize(transformNull(scaleToSeconds(stats.counters." + req.organization.metricSession + "." + req.organization.name + "." + name + ".{" + containers.map(function(container) {
							return container.config.name.split('.').pop()
						}) + "}.{" + containers.map(function(container) {
							return container.config.channel.split('.')[1]
						}) + "}.networks.eth0.rx_bytes.count, 60), 0), '"+summarize+"', 'avg', false),5,6,9))", req.query, next);

					},
					'processes-network' : function(next) {

						getMetrics("aliasByNode(sumSeriesWithWildcards(summarize(transformNull(scaleToSeconds(stats.counters." + req.organization.metricSession + "." + req.organization.name + "." + name + ".{" + containers.map(function(container) {
							return container.config.name.split('.').pop()
						}) + "}.{" + containers.map(function(container) {
							return container.config.channel.split('.')[1]
						}) + "}.networks.eth0.rx_bytes.count, 60), 0), '"+summarize+"', 'avg', false), 9),5,6))", req.query, next);

					},
					'processes-cpu' : function(next) {
						getMetrics("aliasByNode(summarize(transformNull(stats.gauges." + req.organization.metricSession + "." + req.organization.name + "." + name + ".{" + containers.map(function(container) {
							return container.config.name.split('.').pop()
						}) + "}.{" + containers.map(function(container) {
							return container.config.channel.split('.')[1]
						}) + "}.cpu_stats.cpu_usage.percent, 0), '"+summarize+"', 'avg', false),5,6))", req.query, next);
					},
					'processes-memory' : function(next) {
						getMetrics("aliasByNode(summarize(transformNull(stats.gauges." + req.organization.metricSession + "." + req.organization.name + "." + name + ".{" + containers.map(function(container) {
							return container.config.name.split('.').pop()
						}) + "}.{" + containers.map(function(container) {
							return container.config.channel.split('.')[1]
						}) + "}.memory_stats.usage, 0), '"+summarize+"', 'avg', false),5,6))", req.query, next);
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
						if (targets[req.query.target])
							query[req.query.target] = targets[req.query.target];
					}
				} else {
					query = targets;
				}

				async.parallel(query, function(err, results) {

					res.json({
						status : "success",
						metrics : results
					}, 200);
				});
			});
		});
	}
});
/**
 * Export
 */

module.exports = routes;
