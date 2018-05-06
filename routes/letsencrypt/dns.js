'use strict';

/**
 * Routes
 */

var restify = require('restify');
var routes = [];
var select = 'is_active created_at updated_at name logSession metricSession maintenance url domains';

/**
 * GET /organization/:organization/zone
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'POST',
        paths: ['/letsencrypt/dns'],
        version: '1.0.0',
        auth: true,
        staff: true,
        //role : 'admin'
    },
    middleware: async function (req, res, next) {

        let {
            url,
            email = req.user.email
        } = req.body


        let err, domain, certs;

        [err, domain] = await req.to(req.mongoose.Domain.findOne({
            url: url,
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (!domain) {
            return next(new restify.errors.NotFoundError('Domain ' + url + ' not already'));
        }

        [err, certs] = await req.to(req.kue.le.dns({
            domain: url,
            email: email
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        domain.tls = certs._id;

        try {
            await  domain.save()
        } catch (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        req.kue.router.add.tls({
            url: url,
            certificate: certs.cert + certs.chain,
            key: certs.privkey
        })
        res.json({
            status: "success",
            result: certs
        });
    }
});
/**
 * Export
 */

module.exports = routes;
