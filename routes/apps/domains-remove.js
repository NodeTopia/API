'use strict';

/**
 * Routes
 */

var async = require('async');
var restify = require('restify');
var tld = require('tldjs');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/domains
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'DEL',
		paths : ['/organization/:organization/apps/:name/domains/:url','/apps/:name/domains/:url'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var url = req.params.url.toLocaleLowerCase();

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			if (url == app.url) {
				return next(new restify.errors.NotAuthorizedError('Cannot remove stock domain.'));
			}
			var isUrl = false;

			for (var i = 0,
			    j = app.domains.length; i < j; i++) {
				if (app.domains[i].url == url) {
					app.domains.splice(i, 1);
					isUrl = true;
					break;
				}
			};

			if (!isUrl) {
				return next(new restify.errors.NotAuthorizedError('not valid domain.'));
			}

			async.parallel({
				domain : function(next) {
					req.kue.router.remove.url({
						url : url
					}, next);
				},
				tls : function(next) {
					req.kue.router.remove.tls({
						url : url
					}, next);
				}
			}, function() {
				app.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}

					res.send(200);

				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
