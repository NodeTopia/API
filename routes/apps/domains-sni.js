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
		method : 'PUT',
		paths : ['/organization/:organization/apps/:name/domains/:url','/apps/:name/domains/:url'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var url = req.params.url.toLocaleLowerCase();
		var key;
		var certificate;

		if ((req.body.key && req.body.key != '') && (req.body.certificate && req.body.certificate != '')) {
			key = req.body.key;
			certificate = req.body.certificate;
		} else {
			return next(new restify.errors.InvalidArgumentError('PUT body for key and certificate can not be empty'));
		}

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message||err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}

			req.mongoose.Domain.findOne({
				app : app._id,
				url : url
			}, function(err, domain) {
				if (err) {
					return next(new restify.errors.InternalError(err.message||err));
				}
				if (!domain) {
					return next(new restify.errors.ConflictError('Domain does not exists'));
				}
				
				domain.tls.key = key;
				domain.tls.certificate = certificate;
				
				domain.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message||err));
					}

					res.json({
						status : "success",
						result : req.format.domain(domain)
					}, 200);
				});

			});
		});

	}
});

/**
 * Export
 */

module.exports = [];
