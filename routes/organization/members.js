'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/organization/:organization/member'],
		version : '1.0.0',
		auth : true,
		role : 'admin'
	},
	middleware : function(req, res, next) {
		var email = req.body.email;
		var roleName = req.body.role;

		var organization = req.organization;

		console.log(organization.name, email, roleName)

		for (var i = 0,
		    j = organization.membership.length; i < j; i++) {
			if (organization.membership[i].user.email == email) {
				return next(new restify.errors.NotFoundError('User is already a member'));
			}
		};

		mongoose.Roles.findOne({
			name : roleName
		}, function(err, role) {
			if (err) {
				return next(new restify.errors.InternalError(err.message || err));
			}
			if (!role) {
				return next(new restify.errors.NotFoundError('role ' + roleName + ' not found'));
			}
			organization.membership.push({
				user : res.user,
				role : role
			});
			organization.save(function(){
				
			})
		});
	}
});

/**
 * Export
 */

module.exports = routes;
