'use strict';

/**
 * Routes
 */
var async = require('async');
var restify = require('restify');
var routes = [];

/**
 * DELETE /organization/:organization/apps/:name
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'DEL',
		paths : ['/organization/:organization/apps/:name/action', '/apps/:name/action'],
		version : '1.0.0',
		auth : true,
		role : 'collaborator'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			organization : req.organization._id,
			name : name
		}, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}

			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Container.find({
				reference : app._id,
				$or : [{
					'state' : 'RUNNING'
				}, {
					'state' : 'STARTING'
				}, {
					'state' : 'INITIALIZING'
				}],
				type : {
					$nin : ['addon', 'build']
				}
			}, function(err, containers) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}

				async.parallel(containers.map(function(container) {
					return function(next) {
						var stop = req.kue.jobs.create('fleet.container.stop', {
							container : container._id
						});
						stop.on('complete', next.bind(null, null));
						stop.on('failed', next);
						stop.save();
					};
				}), function(err) {
					if (err) {
						return res.json({
							status : "falure",
							error : err
						}, 500);
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
