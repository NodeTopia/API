'use strict';

/**
 * Routes
 */
var async = require('async');
var Moniker = require('moniker');
var restify = require('restify');

var routes = [];

var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';
var Moniker = Moniker.generator([Moniker.adjective, Moniker.noun]);

/**
 * GET /organization/:organization/apps
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/organization/:organization/apps', '/apps'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {

		var name;
		var url;

		if (req.body.name) {

			var nameTest = /^[-\w\.\$@\*\!]{4,30}$/;

			if (nameTest.test(req.body.name)) {
				//return next(new restify.errors.InvalidArgumentError('Application name ' + req.body.name + ' not valid'));
			}

			name = req.body.name.toLocaleLowerCase().replace(/\./g, '_').replace(/ /g, "_");
			url = name + '-' + (Math.floor(Math.random() * 9999) + 1000);
		} else {
			name = url = Moniker.choose() + '-' + (Math.floor(Math.random() * 9999) + 1000);
		}

		var organization = req.organization;

		if (organization.quota.apps + 1 > organization.quota.plan.apps) {
			return next(new restify.errors.ForbiddenError('Application limit (' + organization.quota.plan.apps + ') hit for plan ' + organization.quota.plan.name));
		}

		req.mongoose.App.findOne({
			name : name,
			organization : organization._id,
		}, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (app) {
				return next(new restify.errors.InvalidArgumentError('Application name already in uses'));
			}
			var domain = new req.mongoose.Domain({
				url : url + '.' + req.nconf.get('urls:apps')
			});
			app = new req.mongoose.App({
				userId : req.user._id,
				name : name,
				url : domain.url,
				organization : organization._id,
				metricSession : organization.metricSession,
				domains : [domain._id]
			});
			var repo = new req.mongoose.Repo({
				user : req.user._id,
				app : app._id,
				name : app.name,
				url : req.nconf.get('urls:git') + '/' + organization.name + '/' + app.name + '.git'
			});
			var env = new req.mongoose.Env({
				app : app._id,
				env : {
					CREATE_AT : new Date()
				}
			});
			var formation = new req.mongoose.Formation({
				app : app._id
			});

			organization.quota.apps++;
			organization.apps.push(app);

			async.parallel({
				organization : organization.save,
				app : app.save,
				env : env.save,
				repo : repo.save,
				domain : domain.save,
				formation : formation.save,
				quota : organization.quota.save,
				initDomain : function(next) {
					req.kue.router.add.url({
						organization : organization.name,
						url : domain.url,
						name : app.name,
						metricSession : app.metricSession,
						logSession : app.logSession
					}, next);
				},
			}, function(err) {
				if (err) {
					console.log(err)
					return next(new restify.errors.InternalError(err.message || err));
				}
				req.kue.le.dns({
					domain : domain.url,
					email : req.user.email
				}, function(err, certs) {
					if (err) {
						return
					}

					domain.tls = certs._id;
					domain.save(function() {
						req.kue.router.add.tls({
							url : domain.url,
							certificate : certs.cert + certs.chain,
							key : certs.privkey
						});
					});
				});
				res.json({
					status : "success",
					result : {
						app : req.format.app(app),
						repo : req.format.repo(repo)
					}
				});
			});

		});

	}
});

/**
 * Export
 */

module.exports = routes;
