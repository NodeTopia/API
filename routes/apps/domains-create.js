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
    meta: {
        method: 'POST',
        paths: ['/organization/:organization/apps/:name/domains/:url', '/apps/:name/domains/:url'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let name = req.params.name;
        let url = req.params.url.toLocaleLowerCase();
        let letsencrypt = !!req.body.letsencrypt;

        let err,
            app,
            domain,
            containers;


        [err, app] = await req.to(req.mongoose.App.findOne({
            organization: req.organization._id,
            name: name
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (!app) {
            return next(new restify.errors.NotFoundError('Application ' + name + ' not found'));
        }


        [err, domain] = await req.to(req.mongoose.Domain.findOne({
            url: url
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        if (domain) {
            return next(new restify.errors.ConflictError('Domain already exists'));
        } else {
            domain = new req.mongoose.Domain({
                url: url
            });
        }

        app.domains.push(domain);

        try {
            await Promise.all([domain.save(), app.save()]);
        } catch (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        let promises = [req.kue.router.add.url({
            organization: req.organization.name,
            url: domain.url,
            name: app.name,
            metricSession: app.metricSession,
            logSession: app.logSession
        })];


        if (domain.tls) {
            promises.push(req.kue.router.add.tls({
                url: domain.url,
                certificate: domain.tls.cert + domain.tls.chain,
                key: domain.tls.privkey
            }))
        } else if (letsencrypt) {
            promises.push(new Promise(async function (resolve, reject) {
                let certs
                [err, certs] = await req.to(req.kue.le.dns({
                    domain: domain.url,
                    email: req.user.email
                }))

                domain.tls = certs._id;

                await domain.save();
                resolve(await req.kue.router.add.tls({
                    url: domain.url,
                    certificate: certs.cert + certs.chain,
                    key: certs.privkey
                }));

            }))
        }

        try {
            await Promise.all(promises)
        } catch (err) {

        }
        [err, containers] = await req.to(req.mongoose.Container.find({
            reference: app._id,
            state: 'RUNNING',
            type: 'web'
        }))
        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        try {
            await Promise.all(containers.map(function (container) {
                return req.kue.router.add.host({
                    urls: [domain.url],
                    name: container.type + '.' + container.config.index,
                    host: container.ports[0].ip,
                    port: container.ports[0].port
                });
            }))
        }catch (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }
        res.json({
            status: "success",
            result: req.format.domain(domain)
        });
    }
});

/**
 * Export
 */

module.exports = routes;
