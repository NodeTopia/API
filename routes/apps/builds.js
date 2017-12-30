'use strict';

/**
 * Routes
 */
var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/builds
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/builds', '/apps/:name/builds'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {

		var name = req.params.name;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Build.find({
				app : app._id
			}, null, {
				sort : {
					_id : -1
				}
			}, function(err, builds) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				res.json({
					status : "success",
					result : builds.map(req.format.build)
				}, 200);
			});
		});

	}
});

/**
 * GET /organization/:organization/apps/:name/builds/:build
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/builds/:build', '/apps/:name/builds/:build'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.build;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Build.findOne({
				app : app._id,
				_id : id
			}, function(err, build) {
				if (err) {
					if (err.name == 'CastError') {
						return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
					}
					return next(new restify.errors.InternalError(err));
				}
				if (!build) {
					return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
				}
				res.json({
					status : "success",
					result : req.format.build(build)
				}, 200);
			});
		});

	}
});

/**
 * PUT /organization/:organization/apps/:name/builds/:build
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'PUT',
		paths : ['/organization/:organization/apps/:name/builds/:build', '/apps/:name/builds/:build'],
		version : '1.0.0',
		auth : true,
		role : 'collaborator'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.build;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Build.findOne({
				app : app._id,
				_id : id
			}, function(err, build) {
				if (err) {
					if (err.name == 'CastError') {
						return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
					}
					return next(new restify.errors.InternalError(err));
				}
				if (!build) {
					return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
				}
				if (build.failed) {
					return next(new restify.errors.NotFoundError('Build failed cannot be set as active (' + id + ')'));
				}
				if (build.is_active) {
					return next(new restify.errors.NotFoundError('Build is already active (' + id + ')'));
				}

				req.mongoose.Build.update({
					app : app._id,
					is_active : true
				}, {
					is_active : false
				}, function(err) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					build.is_active = true;
					build.save(function(err) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}
						res.json({
							status : "success",
							result : req.format.build(build)
						}, 200);
					});
				});

			});
		});

	}
});

/**
 * PUT /organization/:organization/apps/:name/builds/:build
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/builds/:build/logs', '/apps/:name/builds/:build/logs'],
		version : '1.0.0',
		auth : true,
		role : 'collaborator'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.build;

		req.mongoose.App.findOne({
			'organization' : req.organization._id,
			'name' : name
		}, select, function(err, app) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!app) {
				return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
			}
			req.mongoose.Build.findOne({
				app : app._id,
				_id : id
			}, function(err, build) {
				if (err) {
					if (err.name == 'CastError') {
						return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
					}
					return next(new restify.errors.InternalError(err));
				}
				if (!build) {
					return next(new restify.errors.NotFoundError('Application build not found (' + id + ')'));
				}

				if (build.process) {
					req.kue.jobs.kue.Job.log(build.process, function(err, logs) {
						if (err) {
							return next(new restify.errors.InternalError(err.message || err));
						}
						res.json({
							status : "success",
							result : logs
						}, 200);
					});
				} else {
					return next(new restify.errors.NotFoundError('Application build logs not found (' + id + ')'));
				}
			});
		});

	}
});

/**
 * Export
 */

module.exports = routes;
