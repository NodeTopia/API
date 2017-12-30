'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/apps/:name/commits
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/commits', '/apps/:name/commits'],
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
			req.mongoose.Repo.findOne({
				'app' : app._id
			}, select, function(err, repo) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!repo) {
					return next(new restify.errors.NotFoundError('Application repo ' + name + ' not found'));
				}
				req.mongoose.Commit.find({
					repo : repo._id
				}, function(err, commits) {
					if (err) {
						return next(new restify.errors.InternalError(err.message || err));
					}
					res.json({
						status : "success",
						result : commits.map(req.format.commit)
					}, 200);
				});
			});
		});

	}
});

/**
 * GET /organization/:organization/apps/:name/commits/:commit
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'GET',
		paths : ['/organization/:organization/apps/:name/commits/:commit', '/apps/:name/commits/:commit'],
		version : '1.0.0',
		auth : true,
		role : 'member'
	},
	middleware : function(req, res, next) {
		var name = req.params.name;
		var id = req.params.commit;

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

			req.mongoose.Repo.findOne({
				'app' : app._id
			}, select, function(err, repo) {
				if (err) {
					return next(new restify.errors.InternalError(err.message || err));
				}
				if (!repo) {
					return next(new restify.errors.NotFoundError('Application repo ' + name + ' not found'));
				}
				req.mongoose.Commit.findOne({
					repo : repo._id,
					_id : id
				}, function(err, commit) {
					if (err) {
						if (err.name == 'CastError') {
							return next(new restify.errors.NotFoundError('Application commit not found (' + id + ')'));
						}
						return next(new restify.errors.InternalError(err.message || err));
					}
					res.json({
						status : "success",
						result : req.format.commit(commit)
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
