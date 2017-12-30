'use strict';

/**
 * Routes
 */

var restify = require('restify');
var authenticate = require('nodetopia-lib/authenticate');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */

routes.push({
	meta : {
		method : 'POST',
		paths : ['/token'],
		version : '1.0.0'
	},
	middleware : authenticate.post
});

/**
 * Export
 */

module.exports = routes;
