﻿(function (module) {

    "use strict";


    var passport = require('passport');
    var BasicStrategy = require('passport-http').BasicStrategy;
    var myUtils = require('../libs/commonFunctions');
    var Encoder = require('node-html-encoder').Encoder;
    var DataResult = require('../../crossLayer/models/dataResult');
    var DataResultPaginated = require('../../crossLayer/models/dataResultPaginated');
    var _ = require("underscore");
    var config = require('../libs/config');
    var crossLayer = require('../../crossLayer/config');
    var P = require('p-promise');

    var HelpdeskTalkModel = require('../models/helpdesk').HelpdeskTalk;
    var HelpdeskPeopleModel = require('../models/helpdesk').HelpdeskPeople;
    var HelpdeskMessageModel = require('../models/helpdesk').HelpdeskMessage;
    var HelpdeskPeopleLastReadModel = require('../models/helpdesk').HelpdeskPeopleLastRead;
    var HelpdeskPeopleInvolvedModel = require('../models/helpdesk').HelpdeskPeopleInvolved;


    var crudAjaxOpts = {
        ajax: {
            _testEmployeeDefaultIdBackOffice: 2,


            _employeeDefaultGet: function (customerId, cb) {

                if (config.get('IsTestEnv')) {

                    HelpdeskPeopleModel.findOne({
                        isEmployee: true,
                        idPersonBackOffice: crudAjaxOpts.ajax._testEmployeeDefaultIdBackOffice
                    }, function (e, employeeDefault) {
                        if (e) return cb(e, null);

                        cb(null, employeeDefault);
                    });
                }
                else {
                    cb(new Error("Not implemented error"), null);
                }

            },
            _talkSave: function (i18n, idTalk, subject, customerId, employeeId, cb) {
                try {



                    var dataResult = null;
                    var modelErrors = [];
                    var isNew = idTalk === null;
                    var validate = function () {

                        if (((subject.trim() === '') === true)) {
                            modelErrors.push({ key: "subject", value: [i18n.__("Views.Crud.FieldRequired")] });
                        }

                        if (isNew && (customerId.toString().trim() === "")) {
                            modelErrors.push({ key: "customerInfo", value: [i18n.__("Views.Crud.FieldRequired")] });
                        }

                    }();


                    


                    if (modelErrors.length > 0) {
                        dataResult = new DataResult(false, i18n.__("Views.Crud.ErrorExistsInForm"), { modelState: modelErrors });
                        cb(null, dataResult);
                    }
                    else {

                        subject = subject.trim();
                        employeeId = employeeId;
                        customerId = customerId;



                        var helpdeskTalk = null;

                        // Simulate saving data
                        if (idTalk === null) {
                            //idTalk = crudAjaxOpts.ajax._fakeDataGridTalks.length;
                            helpdeskTalk = new HelpdeskTalkModel({
                                subject: subject
                            });
                        }
                        else {

                            if (idTalk === undefined) {
                                throw new Error("Argument exception");
                            }

                            idTalk = idTalk;

                            helpdeskTalk = new HelpdeskTalkModel({
                                idTalk: idTalk,
                                subject: subject
                            });

                        }

                        

                        helpdeskTalk.save(function (e, talkObject, numberAffected) {

                            if (e) return cb(e, null);

                            if (isNew) {
                                idTalk = talkObject.idTalk;
                            }

                            new HelpdeskPeopleInvolvedModel({
                                idTalk: idTalk,
                                idPeople: employeeId
                            }).save(function (e, employeeInvolved, numberAffected) {

                                if (e) return cb(e, null);

                                var sendResult = function () {



                                    dataResult = new DataResult(
                                        true,
                                        isNew ? i18n.__("Helpdesk.Talks.Subject.NewSubjectAdded") :
                                                i18n.__("Template.Widget.Crud.SavedChanges"),
                                        {
                                            idTalk: idTalk
                                        });




                                    cb(null, dataResult);

                                };





                                if (isNew) {

                                    new HelpdeskPeopleInvolvedModel({
                                        idTalk: idTalk,
                                        idPeople: customerId
                                    }).save(function (e, customerInvolved, numberAffected) {
                                        sendResult();
                                    });

                                }
                                else {
                                    // existing talks must NOT change its customerId
                                    sendResult();
                                }




                            });



                        });

                    }



                } catch (e) {
                    cb(e, null);
                }
            },
            _fakeMessageObjectToViewModel: function (currentUserIdPeople, peopleInvolvedDetailsArray, message) {

                var whoPosted = _.first(_.filter(peopleInvolvedDetailsArray, function (elem) { return elem.idPeople == message.idPeople; }));



                return {
                    idMessage: message.idMessage,
                    idTalk: message.idTalk,
                    message: message.message,
                    datePosted: message.datePosted,
                    whoPosted: {
                        name: whoPosted.name,
                        isEmployee: whoPosted.isEmployee,
                        isCurrentUser: message.idPeople === currentUserIdPeople
                    }
                };

            },


            reqCredentialsCheck: function (req, username, password, callback) {

                var i18n = req.i18n;

                var invalidCredentials = function () {
                    callback(null, false, {
                        message: i18n.__("AccountResources.InvalidCredentials")
                    });
                };

                var checkByCookieName = function (cookieName) {

                    if (req.cookies[cookieName]) {

                        var peopleId = req.cookies[cookieName];

                        HelpdeskPeopleModel.findOne({
                            idPeople: peopleId
                        }, function (err, peopleInfo) {

                            if (peopleInfo === null) {
                                invalidCredentials();
                            }
                            else {
                                callback(null, peopleInfo);
                            }


                        });

                    }
                    else {
                        invalidCredentials();
                    }
                };

                // some api routes are for customers
                // and another ones are for employees only
                // this methods returns tru if api route for the current request
                // was a customer route
                // See /src/backend/routing/routesApiUser.js
                if (req.params.apiEndpointType === 'customer') {
                    checkByCookieName(crossLayer.cookies.helpdeskCustomerId);
                }
                else {
                    checkByCookieName(crossLayer.cookies.helpdeskEmployeeId);
                }
            },
            reqAuthenticate: function (req, res, next) {

                //  when using basic auth passports sends header WWW-Authenticate
                //  which forces browser to show a dialog box asking for user credentials 
                //  

                //passport.authenticate('basic', {
                //    session: false
                //})(req, res, next);

                // I use a custom callback on passport baic auth
                // avoiding this header to be sent

                passport.authenticate(
                    'basic', {
                        session: false
                    },
                    function (err, user, info) {

                        if (err) {
                            return next(err);
                        }
                        if (!user) {
                            res.status(401);
                        }

                        req.user = user;

                        next();

                    })(req, res, next);
            },


            testMethodInitDb: function (cb) {

                var self = this;
                var dataToModel = function (all) {

                    var employeeCurrent = all.filter(function (element) {
                        return element.isEmployee === true;
                    })[0];
                    var employeeAnother = all.filter(function (element) {
                        return element.isEmployee === true;
                    })[1];
                    var employeeDefault = all.filter(function (element) {
                        return (element.isEmployee === true) && (element.idPersonBackOffice == crudAjaxOpts.ajax._testEmployeeDefaultIdBackOffice);
                    })[0];
                    var customerCurrent = all.filter(function (element) {
                        return element.isEmployee === false;
                    })[0];
                    var customerAnother = all.filter(function (element) {
                        return element.isEmployee === false;
                    })[1];


                    self._testEmployeeDefault = employeeDefault;


                    cb(null, {
                        all: all,
                        employeeCurrent: employeeCurrent,
                        employeeAnother: employeeAnother,
                        employeeDefault: employeeDefault,
                        customerCurrent: customerCurrent,
                        customerAnother: customerAnother
                    });


                };


                HelpdeskPeopleModel.find({}, function (e, existingData) {

                    if (existingData.length === 0) {
                        var pMax = 10; // pMax -> number of employees & number of customers created
                        var initPeople = function () {


                            var peopleSaved = [];

                            for (var j = 0; j < pMax; j++) {

                                peopleSaved.push(new HelpdeskPeopleModel({
                                    //idPeople: j,      // -> identity (1,1)
                                    idPersonBackOffice: j,    //identificaador de la persona en ORG_TB_EMLPEADOS
                                    isEmployee: true,
                                    name: "Empleado/Employee " + j
                                }).save());

                            }

                            for (var k = 0; k < pMax; k++) {

                                peopleSaved.push(new HelpdeskPeopleModel({
                                    //idPeople: pMax + k,
                                    idPersonBackOffice: k,    //identificaador de la persona en PEF_tb_personaFisica
                                    isEmployee: false,
                                    name: "Cliente/Customer " + k
                                }).save());
                            }



                            return P.all(peopleSaved).nodeify(function (e, data) {

                                if (e !== null) {
                                    cb(e, null);
                                }
                                else {
                                    HelpdeskPeopleModel.find({}, function (e, all) {
                                        dataToModel(all);
                                    });
                                }
                            });

                        }();
                    }
                    else {
                        dataToModel(existingData);
                    }
                });

            },



            talkSearch: function (req, filter, cb) {

                var dataToViewModel = function (dataSourceArray, cb) {

                    var dataResult = new DataResultPaginated();
                    dataResult.isValid = true;
                    dataResult.data.totalRows = dataSourceArray.length;
                    dataResult.data.page = filter.page;
                    dataResult.data.pageSize = filter.pageSize;

                    for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
                        if (i < dataSourceArray.length) {
                            dataResult.data.data.push({
                                idTalk: dataSourceArray[i].idTalk,
                                subject: dataSourceArray[i].subject,
                                dateLastMessage: new Date(), // crudAjaxOpts.ajax._fakeMessagesGetDateLastMessage(dataSourceArray[i].idTalk),
                                nMessagesUnread: 0
                            });
                        }
                    }

                    return dataResult;
                };

                if (!req.user.isEmployee) {
                    // set filter on customer talks
                    filter.customerInfo = {
                        customerId: req.user.idPeople
                    };

                    HelpdeskPeopleInvolvedModel.find({
                        idPeople: filter.customerInfo.customerId
                    }, function (err, data) {

                        if (err) return cb(err);

                        var userTalkIds = _.map(data, function (value, index, list) { return value.idTalk; });

                        HelpdeskTalkModel.find({
                            idTalk: {
                                $in: userTalkIds
                            },
                            //idTalk: userTalkIds, // valid as weell
                        }, function (err, userTalks) {

                            if (err) return cb(err, null);

                            HelpdeskPeopleLastReadModel.find({
                                idPeople: req.user.idPeople
                            }, function (err, lastReadResults) {

                                if (err) return cb(err, null);

                                return cb(null, dataToViewModel(userTalks));
                            });

                        });

                    });
                }
                else {
                    cb(null, dataToViewModel(crudAjaxOpts.ajax._fakeDataGridTalks));
                }
            },
            talkAdd: function (req, dataItem, cb) {

                crudAjaxOpts.ajax._employeeDefaultGet(req.user.idPeople, function (e, employeeDefault) {

                    if (e) return cb(e, null);

                    crudAjaxOpts.ajax._talkSave(
                        req.i18n,
                        null,
                        dataItem.subject,
                        employeeDefault.idPeople, //employeeId
                        req.user.idPeople, // customerId
                        function (e, dataResult) {

                            if (e) return cb(e, null);

                            if (dataResult.isValid === true) {

                                HelpdeskTalkModel.findOne({
                                    idTalk: dataResult.data.idTalk
                                }, function (e, talkDetail) {

                                    if (e) return cb(e, null);

                                    dataItem.editData = talkDetail;
                                    dataItem.formData = undefined;
                                    dataResult.data = dataItem;

                                    cb(null, dataResult);
                                });

                            }
                            else {
                                cb(null, dataResult);
                            }

                        });
                });
            },
            messageAdd: function (req, dataItem, cb) {

                var dataResult = null;
                var modelErrors = [];

                if (((dataItem.message.trim() === '') === true)) {
                    // do not validate
                    // In case message is empty then fail silently at backend
                    // as far as client validation should occur before arrive here

                    //modelErrors.push({ key: "message", value: [i18n.__("Views.Crud.FieldRequired")] });
                }

                if (modelErrors.length > 0) {
                    cb(null, new DataResult(false, i18n.__("Views.Crud.ErrorExistsInForm"), { modelState: modelErrors }));
                }
                else {

                    var messageDate = new Date();

                    new HelpdeskMessageModel({
                        //idMessage: newId,
                        idTalk: dataItem.idTalk,
                        idPeople: req.user.idPeople, // this should be set at server runtime using authentication info
                        message: dataItem.message, // --> REMEMBER !!!! as far as this is going to be at server side: do HtmlEncode of the dataItem.message property value (use some npm-hemlEncode existing module)
                        datePosted: messageDate,
                    }).save(function (e, messageObject, messageNumberAffected) {

                        if (e) return cb(e, null);

                        HelpdeskTalkModel.findOne({
                            idTalk: messageObject.idTalk
                        }, function (e, talkObject) {

                            if (e) return cb(e, null);

                            HelpdeskTalkModel
                                .update({ _id: talkObject._id }, { dateLastMessage: messageDate }, {},
                                function (e, updateResult) {

                                    if (e) return cb(e, null);

                                    dataResult = new DataResult(true, "", messageObject);
                                    cb(null, dataResult);

                                });
                        });
                    });
                }
            },
            messageGetAll: function (req, params, cb) {

                // simulate pagination. BUT set pageSize to a huge number
                // as far as client message page is not indended to be paginated
                // at least first version

                //var filter = {
                //    page: 0,
                //    pageSize: 1000,
                //    filter: {
                //        idTalk: idTalk
                //    }
                //};

                var filter = params;
                var idTalk = filter.filter.idTalk;
                var dataResult = new DataResultPaginated();

                // as far as this should be executed at server runtime:
                // check first if current request user has permission to see this conversation
                // this will be hardcodeed just to make fake easier

                HelpdeskPeopleInvolvedModel.find({
                    idTalk: idTalk
                }, function (e, peopleInvolved) {

                    if (e) return cb(e, null);


                    var hasPermission = peopleInvolved.length > 0;

                    if (hasPermission) {

                        var peopleInvolvedIds = _.map(peopleInvolved, function (value, index, list) { return value.idPeople; });

                        HelpdeskPeopleModel.find({
                            idPeople: {
                                $in: peopleInvolvedIds
                            }
                        }, function (e, peopleInvolvedDetails) {

                            if (e) return cb(e, null);

                            HelpdeskMessageModel.find({
                                idTalk: idTalk
                            }, function (e, messagesByIdTalk) {

                                for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
                                    if (i < messagesByIdTalk.length) {
                                        dataResult.data.data.push(crudAjaxOpts.ajax._fakeMessageObjectToViewModel(req.user.idPeople, peopleInvolvedDetails, messagesByIdTalk[i]));
                                    }
                                }

                                dataResult.isValid = true;
                                dataResult.data.totalRows = messagesByIdTalk.length;
                                dataResult.data.page = filter.page;
                                dataResult.data.pageSize = filter.pageSize;

                                cb(null, dataResult);
                            });

                        });
                    }
                    else {

                        dataResult.isValid = false;
                        dataResult.message = i18n.__("GeneralTexts.PermissionDenied");
                        cb(null, dataResult);
                    }
                });

            },
            messageGetUnread: function (req, params, cb) {

                //var idTalk = params.idTalk;
                //var idMessageLastRead = params.idMessageLastRead;

                // simulate pagination. BUT set pageSize to a huge number
                // as far as client message page is not indended to be paginated
                // at least first version

                //var filter = {
                //    page: 0,
                //    pageSize: 1000,
                //    filter: {
                //        idTalk: idTalk,
                //        idMessageLastRead: idMessageLastRead
                //    }
                //};

                var filter = params;
                var idTalk = filter.filter.idTalk;
                var idMessageLastRead = filter.filter.idMessageLastRead;



                //var self = this;
                //var dfd = jQuery.Deferred();
                var dataResult = new DataResultPaginated();


                // as far as this should be executed at server runtime:
                // check first if current request user has permission to see this conversation
                // this will be hardcodeed just to make fake easier

                var hasPermission = true;


                if (hasPermission) {

                    var messagesAlreadyRead = function (arrayItem) {
                        return arrayItem.idMessage > idMessageLastRead;
                    };
                    var messagesFromOtherUsers = function (arrayItem) {

                        var viewModeledItem = crudAjaxOpts.ajax._fakeMessageObjectToViewModel(arrayItem);

                        return viewModeledItem.whoPosted.isCurrentUser === false;
                    };

                    var messagesByIdTalk = [];
                    messagesByIdTalk = crudAjaxOpts.ajax._fakeMessagesByidTalkGet(idTalk);
                    messagesByIdTalk = messagesByIdTalk.filter(messagesAlreadyRead);
                    messagesByIdTalk = messagesByIdTalk.filter(messagesFromOtherUsers);

                    for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
                        if (i < messagesByIdTalk.length) {
                            dataResult.data.data.push(crudAjaxOpts.ajax._fakeMessageObjectToViewModel(messagesByIdTalk[i]));
                        }
                    }

                    dataResult.isValid = true;
                    dataResult.data.totalRows = messagesByIdTalk.length;
                    dataResult.data.page = filter.page;
                    dataResult.data.pageSize = filter.pageSize;
                }
                else {

                    dataResult.isValid = false;
                    dataResult.message = i18n.__("GeneralTexts.PermissionDenied");
                }

                cb(null, dataResult);
            },
            /************************************************************
                                Methods for employee
            *************************************************************/
            talkGetById: function (req, dataItem, cb) {

                var dataResult = null;

                crudAjaxOpts.ajax._fakeDataGridTalkGetByIdForEdit(req.i18n, dataItem.idTalk,
                    function (error, dataResult) {
                        if (error) {
                            cb(error, null);
                        }
                        else {
                            cb(null, dataResult);
                        }
                    });

            },
            talkSavedByEmployee: function (req, dataItem, cb) {

                crudAjaxOpts.ajax._fakeDataGridTalkSave(
                    req.i18n,
                    dataItem.isNew === true ? null : dataItem.formData.idTalk,
                    dataItem.formData.subject,
                    dataItem.formData.customerInfo.customerId, // customerId
                    crudAjaxOpts.ajax._fakeCurrentEmployee.idPeople, //employeeId -> taken from current user request
                    function (e, dataResult) {


                        if (e) {
                            cb(e, null);
                        }
                        else {

                            if (dataResult.isValid === true) {

                                crudAjaxOpts.ajax._fakeDataGridTalkGetByIdForEdit(
                                    req.i18n,
                                    dataResult.data.idTalk,
                                    function (eGetById, dataResultGetById) {
                                        if (eGetById) {
                                            setTimeout(function () { dfd.reject(eGetById); }, crudAjaxOpts.ajax._fakeDelay);
                                        }
                                        else {

                                            if (dataResultGetById.isValid) {
                                                // ponemos en el mensaje de salida
                                                // el mensaje resultado de guardar
                                                dataResultGetById.messages[0] = dataResult.messages[0];
                                            }

                                            cb(null, dataResultGetById);
                                        }
                                    });
                            }

                            cb(null, dataResult);
                        }
                    });




            },
            customerSearch: function (req, filter, cb) {

                var customers = [];

                for (var j = 0; j < crudAjaxOpts.ajax._fakeDataGridPeople.length; j++) {
                    if (crudAjaxOpts.ajax._fakeDataGridPeople[j].isEmployee === false) {
                        customers.push(crudAjaxOpts.ajax._fakeDataGridPeople[j]);
                    }
                }

                var dataResult = new DataResultPaginated();
                dataResult.isValid = true;
                dataResult.data.totalRows = customers.length;
                dataResult.data.page = filter.page;
                dataResult.data.pageSize = filter.pageSize;


                for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
                    if (i < customers.length) {

                        dataResult.data.data.push({
                            customerCardId: new Array(11).join(customers[i].idPeople.toString()), // make inner join using idPersonBackOffice and get customer card id 
                            customerId: customers[i].idPeople,
                            customerName: customers[i].name
                        });

                    }
                }

                cb(null, dataResult);
            },
            employeeSearch: function (req, filter, cb) {

                var employees = [];
                var i18n = req.i18n;

                for (var j = 0; j < crudAjaxOpts.ajax._fakeDataGridPeople.length; j++) {
                    if (crudAjaxOpts.ajax._fakeDataGridPeople[j].isEmployee === true) {
                        employees.push(crudAjaxOpts.ajax._fakeDataGridPeople[j]);
                    }
                }

                var dataResult = new DataResultPaginated();
                dataResult.isValid = true;
                dataResult.data.totalRows = employees.length;
                dataResult.data.page = filter.page;
                dataResult.data.pageSize = filter.pageSize;


                for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
                    if (i < employees.length) {

                        dataResult.data.data.push({
                            employeeId: employees[i].idPeople,
                            employeeName: employees[i].name,
                            employeeEmail: myUtils.stringFormatCSharp("{0}{1}@something.com", i18n.__("Helpdesk.Talks.Employee"), employees[i].idPeople),// make inner join using idPersonBackOffice and get employee email address
                        });

                    }
                }

                cb(null, dataResult);
            },

        },
        cache: {

        }
    };

    passport.use(new BasicStrategy({ passReqToCallback: true }, crudAjaxOpts.ajax.reqCredentialsCheck));


    module.exports.testMethodInitDb = crudAjaxOpts.ajax.testMethodInitDb;
    module.exports.isAuthenticated = crudAjaxOpts.ajax.reqAuthenticate;
    module.exports.talkSearch = crudAjaxOpts.ajax.talkSearch;
    module.exports.talkAdd = crudAjaxOpts.ajax.talkAdd;
    module.exports.messageAdd = crudAjaxOpts.ajax.messageAdd;
    module.exports.messageGetAll = crudAjaxOpts.ajax.messageGetAll;
    module.exports.messageGetUnread = crudAjaxOpts.ajax.messageGetUnread;

    module.exports.talkGetById = crudAjaxOpts.ajax.talkGetById;
    module.exports.talkSavedByEmployee = crudAjaxOpts.ajax.talkSavedByEmployee;
    module.exports.customerSearch = crudAjaxOpts.ajax.customerSearch;
    module.exports.employeeSearch = crudAjaxOpts.ajax.employeeSearch;


})(module);
