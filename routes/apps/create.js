'use strict';

/**
 * Routes
 */
var async = require('async');
var Moniker = require('moniker');
var restify = require('restify');

var routes = [];

Moniker = Moniker.generator([Moniker.adjective, Moniker.noun]);


function getName(req) {
    let name;
    if (req.body.name) {
        var nameTest = /^[-\w\.\$@\*\!]{4,30}$/;
        if (nameTest.test(req.body.name)) {
            //return false;
        }
        name = req.body.name.toLocaleLowerCase().replace(/\./g, '_').replace(/ /g, "_");
    } else {
        name = Moniker.choose();
    }
    return name + '-' + (Math.floor(Math.random() * 9999) + 1000);
}

function createAndSaveDocs(req, name) {
    return new Promise(async function (resolve, reject) {

        let domain = new req.mongoose.Domain({
            url: name + '.' + req.nconf.get('urls:apps')
        });
        let app = new req.mongoose.App({
            userId: req.user._id,
            name: name,
            url: domain.url,
            organization: req.organization._id,
            metricSession: req.organization.metricSession,
            domains: [domain._id]
        });
        let repo = new req.mongoose.Repo({
            user: req.user._id,
            app: app._id,
            name: app.name,
            url: req.nconf.get('urls:git') + '/' + req.organization.name + '/' + app.name + '.git'
        });
        let env = new req.mongoose.Env({
            app: app._id,
            env: {
                CREATE_AT: new Date()
            }
        });
        let formation = new req.mongoose.Formation({
            app: app._id
        });

        req.organization.quota.apps++;
        req.organization.apps.push(app);

        try {
            await Promise.all([
                app.save(),
                domain.save(),
                repo.save(),
                env.save(),
                formation.save(),
                req.organization.quota.save(),
                req.organization.save(),
                req.kue.router.add.url({
                    organization: req.organization.name,
                    url: domain.url,
                    name: app.name,
                    metricSession: app.metricSession,
                    logSession: app.logSession
                })
            ])
            resolve({
                app: app,
                repo: repo,
                domain: domain
            })
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * GET /organization/:organization/apps
 * Version: 1.0.0
 */

routes.push({
    meta: {
        method: 'POST',
        paths: ['/organization/:organization/apps', '/apps'],
        version: '1.0.0',
        auth: true,
        role: 'admin'
    },
    middleware: async function (req, res, next) {

        let name = getName(req);
        let organization = req.organization,
            err,
            app,
            docs;

        if (name === false) {
            return next(new restify.errors.InvalidArgumentError('Application name ' + req.body.name + ' not valid'));
        } else if (organization.quota.apps + 1 > organization.quota.plan.apps) {
            return next(new restify.errors.ForbiddenError(
                'Application limit (' + organization.quota.plan.apps + ') hit for plan ' + organization.quota.plan.name
            ));
        }


        [err, app] = await req.to(req.mongoose.App.findOne({
            name: name,
            organization: organization._id,
        },'name'))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        if (app) {
            return next(new restify.errors.InvalidArgumentError('Application name already in uses'));
        }

        [err, docs] = await req.to(createAndSaveDocs(req, name));

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        let certs;
        [err, certs] = await req.to(req.kue.le.dns({
            domain: docs.domain.url,
            email: req.user.email
        }))

        if (err) {
            return next(new restify.errors.InternalError(err.message || err));
        }

        docs.domain.tls = certs._id;

        try {
            await Promise.all([
                req.kue.router.add.tls({
                    url: docs.domain.url,
                    certificate: certs.cert + certs.chain,
                    key: certs.privkey
                }),
                docs.domain.save()
            ])
            res.json({
                status: "success",
                result: {
                    app: req.format.app(docs.app),
                    repo: req.format.repo(docs.repo)
                }
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
