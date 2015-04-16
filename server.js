﻿(function(module) {

    'user strict';

    var express = require('express');
    var favicon = require('serve-favicon');
    var methodOverride = require('method-override');
    var path = require('path');
    var compression = require('compression');
    var passport = require('passport');
    var bodyParser = require('body-parser');
    var config = require('./src/backend/libs/config');
    var mongoose = require('./src/backend/libs/db');
    var log = require('./src/backend/libs/log')(module);
    var cookieParser = require('cookie-parser');
    var i18n = require('i18n-2');
    var util = require('util');
    var exphbs = require('express-handlebars');
    var thisPackage = require('./package.json');

    


    var authController = require('./src/backend/controllers/auth');
    var homeController = require('./src/backend/controllers/home');
    var usersController = require('./src/backend/controllers/users');
    var commonController = require('./src/backend/controllers/common');
    var ErrorHandled = require('./src/backend/models/errorHandled');
    var routingHandler = require('./src/backend/routing/routes');

    var app = express();

    app.use(cookieParser(config.get('encryptKeyForCookieParser')));
    app.set('port', config.get('port'));
    app.use(favicon(__dirname + '/src/frontend/public/favicon.ico'));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(passport.initialize());
    app.use(methodOverride('X-HTTP-Method-Override'));
    app.use(compression());

    app.set('root', __dirname + '/src/frontend/public/');
    app.set('views', __dirname + '/src/frontend/public/views');
    app.engine('handlebars', exphbs({
        layoutsDir: 'src/frontend/public/views/layouts/',
        defaultLayout: 'layout'
    }));
    app.set('view engine', 'handlebars');


    i18n.expressBind(app, config.get("i18n"));



    mongoose.dbInit(function (err, cnn) {

    });

    // set up the middleware
    app.use(function (req, res, next) {
        req.i18n.setLocaleFromCookie();
        //log.info('\n request URL: %s', req.url); // log all requests
        //log.info('\n locale : %s', req.i18n.getLocale()); // log all requests
        next();
    });


    if (process.env.NODE_ENV === 'test') {
        commonController.initTestEnvironment(app);
    }



    //begin -> set public static content folders
    //set the Cache-Control header to one day using milliseconds

    //old 
    //app.use('/public', express.static(__dirname + '/src/frontend/public', {
    //    maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
    //}));

    app.use('/public/cdn', express.static(__dirname + '/src/frontend/public/cdn', {
        maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
    }));
    app.use('/public/fonts', express.static(__dirname + '/src/frontend/public/fonts', {
        maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
    }));
    app.use('/public/images', express.static(__dirname + '/src/frontend/public/images', {
        maxAge: process.env.NODE_ENV === 'production' ? 86400000 : 0
    }));
    //end -> set public static content folders





    routingHandler.setRoutes(app, log, authController);

    //homeController.setRoutes(app, log);
    //usersController.setRoutes(app, authController);
    //commonController.setRoutes(app, log);


    //programmer errors
    process.on('uncaughtException', function (err) {
        try {
            //try logging

            console.log(err.stack);

            log.error(err);

        } catch (errLogging) {

            try {
                //try sending email
                //sendMail.error(err);
            } catch (errSendingEmail) {
                // do nothing here

            }
        }
        process.exit(1);
    });


    app.listen(app.get('port'), function () {

        var d = new Date();

        log.info("********************************************************************");
        log.info("Express server listening : " + util.format('%s', d.toString()));
        log.info('Express server listening on port ' + app.get('port'));
        log.info("********************************************************************");



    });


})(module);