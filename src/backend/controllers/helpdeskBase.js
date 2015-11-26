﻿(function (module) {

    "use strict";

    var HelpdeskUserType = {
        customer: 'customer',
        employee: 'employee'
    };


    module.exports.HelpdeskBaseController = HelpdeskBaseController;
    module.exports.HelpdeskUserType = HelpdeskUserType;
    module.exports.HelpdeskViewUnAuthController = HelpdeskViewUnAuthController;
    module.exports.HelpdeskViewHomeController = HelpdeskViewHomeController;
    module.exports.HelpdeskViewMessageController = HelpdeskViewMessageController;
    module.exports.HelpdeskViewLoadDataController = HelpdeskViewLoadDataController;


    var passport = require('passport');
    var LocalStretegy = require('passport-local').Strategy;

    var myUtils = require('../libs/commonFunctions');
    var Encoder = require('node-html-encoder').Encoder;
    var DataResult = require('../../crossLayer/models/dataResult');
    var DataResultPaginated = require('../../crossLayer/models/dataResultPaginated');
    var _ = require("underscore");
    var config = require('../libs/config');
    var crossLayer = require('../../crossLayer/config');
    var helpdeskCrossLayer = require('../../crossLayer/helpdesk');
    var P = require('p-promise');
    var http = require('http');
    var querystring = require('querystring');
    var ErrorHandledModel = require('../../crossLayer/models/errorHandled');
    var normalizeForSearch = require('normalize-for-search');
    var GenericViewController = require('./classes/genericView');


    function HelpdeskBaseController() {

    }
    HelpdeskBaseController.prototype.talkSearch = function (req, params, cb) {

        var self = this;

        if (!req.user.isEmployee) {
            self._talkSearchByCustomer(req, params, cb);
        }
        else {
            self._talkSearchByEmployee(req, params, cb);
        }

    };
    HelpdeskBaseController.prototype.talkAdd = function (req, dataItem, cb) {

        var self = this;

        this._employeeDefaultGet(req.i18n, req.user.idPeople, function (e, employeeDefault) {

            if (e) return cb(e, null);

            self._talkSave(
                req.i18n,
                null,
                dataItem.subject,
                req.user.idPeople, // customerId
                employeeDefault.idPeople, //employeeId
                function (e, dataResult) {

                    if (e) return cb(e, null);

                    if (dataResult.isValid === true) {

                        var talkDetail = dataResult.data.talkObject;
                        dataItem.editData = talkDetail;
                        dataItem.formData = undefined;
                        dataResult.data = dataItem;

                        cb(null, dataResult);
                    }
                    else {
                        cb(null, dataResult);
                    }

                });
        });
    };
    HelpdeskBaseController.prototype.messageAdd = function (req, dataItem, cb) {
        cb(new Error("Not implemented exception"), null);
    };
    HelpdeskBaseController.prototype.messageGetAll = function (req, params, cb) {
        cb(new Error("Not implemented exception"), null);
    };
    HelpdeskBaseController.prototype.messageGetUnread = function (req, params, cb) {
        cb(new Error("Not implemented exception"), null);
    };
    /************************************************************
                        Methods for employee
    *************************************************************/
    HelpdeskBaseController.prototype.talkGetById = function (req, dataItem, cb) {

        var dataResult = null;


        this._fakeDataGridTalkGetByIdForEdit(req, dataItem.idTalk,
            function (e, dataResult) {
                if (e) return cb(e, null);

                cb(null, dataResult);

            });
    };
    HelpdeskBaseController.prototype.talkSavedByEmployee = function (req, dataItem, cb) {

        var self = this;

        self._talkSave(
            req.i18n,
            dataItem.isNew === true ? null : dataItem.formData.idTalk,
            dataItem.formData.subject,
            dataItem.formData.customerInfo.customerId, // customerId
            req.user.idPeople, //employeeId
            function (e, dataResult) {

                if (e) return cb(e, null);

                if (dataResult.isValid === true) {
                    self._fakeDataGridTalkGetByIdForEdit(
                        req,
                        dataResult.data.idTalk,
                        function (e, dataResultGetById) {

                            if (e) return cb(e, null);

                            if (dataResultGetById.isValid) {
                                // ponemos en el mensaje de salida
                                // el mensaje resultado de guardar
                                dataResultGetById.messages[0] = dataResult.messages[0];
                            }

                            cb(null, dataResultGetById);
                        });
                }
                else {
                    cb(null, dataResult);
                }


            });

    };



    function HelpdeskViewUnAuthController() {
        GenericViewController.apply(this, arguments);
    }
    HelpdeskViewUnAuthController.prototype = new GenericViewController();
    HelpdeskViewUnAuthController.prototype.viewIndexModel = function (req, res, cb) {

        this.deleteCookie(res, "oAuthTicket");

        cb(null, {});
    };

    function HelpdeskViewHomeController(apiController) {
        this.apiController = apiController;
        GenericViewController.apply(this, arguments);
    }
    HelpdeskViewHomeController.prototype = new GenericViewController();
    HelpdeskViewHomeController.prototype.viewIndexModel = function (req, res, cb) {

        if (req.user !== null) {

            if (req.user === false) {

                cb(null, {
                    WhoYouAreMessage: req.i18n.__('Helpdesk.Talks.Auth.PersonNotFound')
                });

            }
            else {

                var sendResult = function (wellcomeMsg, defaultEmployeeInfo) {

                    cb(null, {
                        Customers: req.user.isEmployee === false ? [req.user] : undefined,
                        Employees: req.user.isEmployee === true ? [req.user] : undefined,
                        WhoYouAreMessage: req.i18n.__('Helpdesk.Talks.Auth.Wellcome.WhoYouAreMessage'),
                        WellcomeMessage: wellcomeMsg,
                        defaultEmployeeInfo: defaultEmployeeInfo
                    });
                };

                if (req.params.apiEndpointType === HelpdeskUserType.customer) {
                    this.apiController._employeeDefaultGet(
                        req.i18n,
                        req.user.idPeople,
                        function (e, defaultEmployeeInfo) {
                            sendResult(req.i18n.__('Helpdesk.Talks.Home.Wellcome.Customer.Description'), {
                                name: defaultEmployeeInfo.name,
                                email: defaultEmployeeInfo.email
                            });
                        });
                }
                else {
                    sendResult(req.i18n.__('Helpdesk.Talks.Home.Wellcome.Employee.Description'), undefined);
                }

            }
        }
        else {
            cb(null, {
                WhoYouAreMessage: req.i18n.__('Helpdesk.Talks.Auth.Wellcome.AuthTicketIsNull')
            });
        }

    };

    function HelpdeskViewMessageController(apiController) {
        this.apiController = apiController;
        GenericViewController.apply(this, arguments);
    }
    HelpdeskViewMessageController.prototype = new GenericViewController();
    HelpdeskViewMessageController.prototype.viewIndexModel = function (req, res, cb) {

        var self = this;

        var sendInvalidaCredentials = function () {
            cb(null, {
                talkTitle: req.i18n.__("Helpdesk.Talks.Auth.Wellcome.AuthTicketIsNull")
            });
        };

        if (req.user === null) return sendInvalidaCredentials();

        if (req.user === false) return sendInvalidaCredentials();

        req.user = req.user;

        self.apiController.talkGetById(req, { idTalk: req.query.idTalk },
            function (e, talkObject) {

                if (e) return cb(e, null);

                if (talkObject.isValid) {
                    cb(null, {
                        talkTitle: talkObject.data.subject
                    });
                }
                else {
                    cb(null, {
                        talkTitle: talkObject.messages.join(' ')
                    });
                }
            });

    };

    function HelpdeskViewLoadDataController(apiController) {
        this.apiController = apiController;
        GenericViewController.apply(this, arguments);
    }
    HelpdeskViewLoadDataController.prototype = new GenericViewController();
    HelpdeskViewLoadDataController.prototype.viewIndexModel = function (req, res, cb) {

        this.apiController.loadDataTest(req.i18n, function (e, result) {

            if (e) return cb(e, null);

            cb(null, result);

        });

    };

})(module);