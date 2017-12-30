'use strict';

/**
 * Routes
 */
var readline = require('readline');
var http = require('http');
var querystring = require('querystring');
var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/env
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/logs','/apps/:name/logs'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : [
	function(req, res, next) {
		if (req.headers.accept == 'text/event-stream') {
			return next();
		}

		var name = req.params.name;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			var filter = {
				start : req.query.start ? req.query.start : 0,
				end : req.query.backlog ? req.query.backlog : 300
			};
			if (req.query.tail) {
				filter.tail = true;
			}
			if (req.query.format == 'json') {
				filter.format = 'json';
			}
			var logreq = http.request({
				headers : {
					Connection : 'keep-alive'
				},
				hostname : req.nconf.get('logs:web:host'),
				port : req.nconf.get('logs:web:port'),
				path : '/sessions/' + app.logSession + '?' + querystring.stringify(filter),
				method : 'GET',
				agent : false
			}, function(logres) {
				logres.setTimeout(60 * 60 * 1000, function() {

				});
				logres.pipe(res);
			});
			logreq.end();

		});

	},
	function(req, res, next) {

		var name = req.params.name;
		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			res.setHeader('Content-Type', 'text/event-stream');
			res.writeHead(200);
			res.write('\n\n');

			var filter = {
				start : req.query.start ? req.query.start : 0,
				end : req.query.backlog ? req.query.backlog : 300
			};

			filter.tail = true;

			if (req.query.format == 'json') {
				filter.format = 'json';
			}
			var logreq = http.request({
				headers : {
					Connection : 'keep-alive'
				},
				hostname : req.nconf.get('logs:web:host'),
				port : req.nconf.get('logs:web:port'),
				path : '/sessions/' + app.logSession + '?' + querystring.stringify(filter),
				method : 'GET',
				agent : false
			}, function(logres) {
				logres.setTimeout(60 * 60 * 1000, function() {

				});
				var rl = readline.createInterface({
					input : logres,
					output : process.stdout,
					terminal : false
				});
				rl.on('line', function(line) {
					res.write('data: ' + line + '\n\n');
				});
				logres.on('end', function() {
					res.end();
				});
			});
			logreq.end();
		});

	}]

});

/**
 * Export
 */

module.exports = routes;
