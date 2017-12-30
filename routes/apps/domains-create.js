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
		method : 'POST',
		paths : ['/organization/:organization/apps/:name/domains/:url', '/apps/:name/domains/:url'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;
		var url = req.params.url.toLocaleLowerCase();
		console.log(url, req.params.url)
		var letsencrypt = !!req.body.letsencrypt;

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

			req.mongoose.Domain.findOne({
				url : url
			}, function(err, domain) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (domain) {
					return next(new restify.errors.ConflictError('Domain already exists'));
				}

				domain = new req.mongoose.Domain({
					url : url
				});
				app.domains.push(domain);

				domain.save(function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					app.save(function(err) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}

						async.parallel({
							domain : function(next) {
								req.kue.router.add.url({
									organization : req.organization.name,
									url : domain.url,
									name : app.name,
									metricSession : app.metricSession,
									logSession : app.logSession
								}, next);
							},
							tls : function(next) {
								if (domain.tls) {
									req.kue.router.add.tls({
										url : domain.url,
										certificate : domain.tls.cert + domain.tls.chain,
										key : domain.tls.privkey
									}, next);
								} else if (letsencrypt) {
									req.kue.le.dns({
										domain : domain.url,
										email : req.user.email
									}, function(err, certs) {

										domain.tls = certs._id;

										domain.save(function() {
											req.kue.router.add.tls({
												url : domain.url,
												certificate : certs.cert + certs.chain,
												key : certs.privkey
											}, next);
										});
									});
								} else {
									next();
								}
							}
						}, function() {
							req.mongoose.Container.find({
								reference : app._id,
								state : 'RUNNING',
								type : 'web'
							}, function(err, containers) {
								if (err) {
									return next(new restify.errors.InternalError(err.message || err));
								}
								async.parallel(containers.map(function(container) {
									return function(next) {
										req.kue.router.add.host({
											urls : [domain.url],
											name : container.type + '.' + container.config.index,
											host : container.ports[0].ip,
											port : container.ports[0].port
										}, next);
									};
								}), function(err) {
									if (err) {
										return next(new restify.errors.InternalError(err.message || err));
									}
									res.json({
										status : "success",
										result : req.format.domain(domain)
									}, 200);
								});
							});
						});
					});

				});
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
