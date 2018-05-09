'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];

/**
 * GET /organization/:organization
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'POST',
        paths: ['/organization/:organization/member'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let {
            email,
            role: roleName
        } = req.body


        let organization = req.organization,
            err,
            role,
            user;


        for (let i = 0,
                 j = organization.membership.length; i < j; i++) {
            if (organization.membership[i].user.email === email) {
                return next(new restify.errors.ConflictError('User is already a member'));
            }
        }

        [err, role] = await req.to(req.mongoose.Roles.findOne({
            name: roleName
        }))
        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!role) {
            return next(new restify.errors.NotFoundError('role ' + roleName + ' not found'));
        }


        [err, user] = await req.to(req.mongoose.User.findOne({
            email: email
        }))
        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!user) {
            return next(new restify.errors.NotFoundError('user ' + email + ' not found'));
        }

        organization.membership.push({
            user: user,
            role: role
        });
        try {
            await organization.save();
            res.json({
                status: "success",
                result: req.format.organization(req.organization)
            });
        } catch (err) {
            next(new restify.errors.InternalError(err.message || err));
        }
    }
});

/**
 * Export
 */

module.exports = routes;
