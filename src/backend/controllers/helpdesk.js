﻿(function (module) {

    "use strict";


    module.exports = HelpdeskAPIController;

    var passport = require('passport');
    var BasicStrategy = require('passport-http').BasicStrategy;
    var myUtils = require('../libs/commonFunctions');
    var Encoder = require('node-html-encoder').Encoder;
    var DataResult = require('../../crossLayer/models/dataResult');
    var DataResultPaginated = require('../../crossLayer/models/dataResultPaginated');
    var _ = require("underscore");
    var config = require('../libs/config');
    var crossLayer = require('../../crossLayer/config');
    var helpdeskCrossLayer = require('../../crossLayer/helpdesk');
    var P = require('p-promise');

    var HelpdeskTalkModel = require('../models/helpdesk').HelpdeskTalk;
    var HelpdeskPeopleModel = require('../models/helpdesk').HelpdeskPeople;
    var HelpdeskMessageModel = require('../models/helpdesk').HelpdeskMessage;
    var HelpdeskPeopleLastReadModel = require('../models/helpdesk').HelpdeskPeopleLastRead;
    var HelpdeskPeopleLastWriteModel = require('../models/helpdesk').HelpdeskPeopleLastWrite;
    var HelpdeskPeopleInvolvedModel = require('../models/helpdesk').HelpdeskPeopleInvolved;


    function HelpdeskAPIController() {
        //GenericViewController.apply(this, arguments);

        this._isInTestMode = true;
        this._testEmployeeDefaultIdBackOffice = 2;

        passport.use('helpdeskStrategy', new BasicStrategy({ passReqToCallback: true }, this.reqCredentialsCheck));
    }

    HelpdeskAPIController.prototype._employeeDefaultGet = function (customerId, cb) {

        if (this._isInTestMode) {

            HelpdeskPeopleModel.findOne({
                isEmployee: true,
                idPersonBackOffice: this._testEmployeeDefaultIdBackOffice
            }, function (e, employeeDefault) {
                if (e) return cb(e, null);

                cb(null, employeeDefault);
            });
        }
        else {
            cb(new Error("Not implemented error"), null);
        }

    };
    HelpdeskAPIController.prototype._talkSave = function (i18n, idTalk, subject, customerId, employeeId, cb) {
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




                var helpdeskTalkSave = function (helpdeskTalk) {

                    helpdeskTalk.save(function (e, talkObject, numberAffected) {

                        if (e) return cb(e, null);

                        if (isNew) {
                            idTalk = talkObject.idTalk;
                        }
                        else {

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

                };
                //var helpdeskTalk = null;

                if (idTalk === null) {
                    helpdeskTalkSave(new HelpdeskTalkModel({
                        subject: subject
                    }));
                }
                else {

                    if (idTalk === undefined) {
                        throw new Error("Argument exception");
                    }

                    //helpdeskTalk = new HelpdeskTalkModel({
                    //    idTalk: idTalk,
                    //    subject: subject
                    //});


                    HelpdeskTalkModel.findOne({ idTalk: idTalk },
                        function (e, helpdeskTalk) {

                            if (e) return cb(e, null);


                            helpdeskTalk.subject = subject;
                            helpdeskTalkSave(helpdeskTalk);
                        });


                }





            }



        } catch (e) {
            cb(e, null);
        }
    };
    HelpdeskAPIController.prototype._talkGetPeopleInvolved = function (idTalk, cb) {

        HelpdeskPeopleInvolvedModel.find({
            idTalk: idTalk,
        }, function (e, peopleInvolved) {

            if (e) return cb(e, null);

            var peopleInvolvedIds = _.map(peopleInvolved, function (value, index, list) { return value.idPeople; });

            HelpdeskPeopleModel.find({
                idPeople: {
                    $in: peopleInvolvedIds
                }
            }, function (e, peopleInvolvedDetails) {

                if (e) return cb(e, null);

                cb(null, peopleInvolvedDetails);
            });

        });

    };
    HelpdeskAPIController.prototype._talkSearchByCustomer = function (req, params, cb) {

        var self = this;

        HelpdeskPeopleInvolvedModel.find({
            idPeople: req.user.idPeople
        },
        function (err, data) {

            if (err) return cb(err);

            self._talkSearchDataToViewModel(
                req.user,
                _.map(data, function (value, index, list) {
                    return value.idTalk;
                }),
                params,
                cb);
        });

    };
    HelpdeskAPIController.prototype._talkSearchByEmployee = function (req, params, cb) {

        var self = this;
        var dbFilter = {};
        var isEmployeeAdmin = false;// by the time I write this line no admin users exists. So hardcode this value
        var peopleInvolvedFilter = [];
        var customerId = function () {

            if ((params.filter.customerInfo) && (params.filter.customerInfo.customerId !== "")) {
                return params.filter.customerInfo.customerId;
            }
            else {
                return null;
            }

        }();
        var employeeId = function () {

            if (isEmployeeAdmin === true) {
                if ((params.filter.employeeInfo) && (params.filter.employeeInfo.employeeId !== "")) {
                    // comprobar si tiene permisos para buscar por otro empleado. Debe ser super user o admin ...
                    return params.filter.employeeInfo.employeeId;
                }
                else {
                    return null;// es employee admin y esta buscando conversaciones de cualquier empleado
                }
            }
            else {
                // en caso de que no sea super user. Añadir el filtro de empleado
                return req.user.idPeople;
            }

        }();

        if (employeeId !== null) peopleInvolvedFilter.push(employeeId);
        if (customerId !== null) peopleInvolvedFilter.push(customerId);

        HelpdeskPeopleInvolvedModel.aggregate(
           [
               // filter talks by idPeople IN...
               // This means ... idPeople == customerId || idPeople == employeeId
               { $match: { idPeople: { $in: peopleInvolvedFilter } } },
               // group those by idTalk
               { $group: { _id: "$idTalk", people: { $push: "$idPeople" } } },
               // add peopleCount field
               {
                   $project: {
                       _id: 0,
                       idTalk: "$_id",
                       people: 1,
                       peopleCount: { $size: "$people" }
                   }
               },
               // filter results getting only those elements 
               // containing $all items in the source array in the destination array
               // This means ... groupedPeople [1,2,3] == destionationArray.[3,1,2]
               { $match: { people: { $all: peopleInvolvedFilter } } },
           ]
        ).exec(function (e, data) {

            var talkIdsArray = _.map(data, function (value, index, list) {
                return value.idTalk;
            });

            self._talkSearchDataToViewModel(req.user, talkIdsArray, params, cb);


        });

    };
    HelpdeskAPIController.prototype._talkSearchDataToViewModel = function (requestIdentityUser, talkIdsArray, params, cb) {

        HelpdeskPeopleLastWriteModel
            .find({
                idTalk: { $in: talkIdsArray },
                idPeople: requestIdentityUser.idPeople // used to track number of unRead Messages
            }, function (e, userLastMessageWrites) {

                if (e) return cb(e, null);

                HelpdeskPeopleLastReadModel
                    .find({
                        idTalk: { $in: talkIdsArray },
                        idPeople: requestIdentityUser.idPeople // used to track number of unRead Messages
                    }, function (e, userLastMessageReads) {

                        if (e) return cb(e, null);

                        HelpdeskMessageModel.aggregate([
                           { $match: { idTalk: { $in: talkIdsArray } } },
                           // group those by idTalk
                           {
                               $group: {
                                   _id: "$idTalk",
                                   messages: { $push: "$$ROOT" }
                               },
                           },
                           {
                               $project: {
                                   _id: 0,
                                   idTalk: "$_id",
                                   messages: 1,
                               },
                           },
                        ])
                        .exec(function (e, groupedMessages) {

                            if (e) return cb(e, null);


                            if (params.filter.lastMessageStatus) {

                                var idTalksToRemove = [];

                                _.each(groupedMessages, function (elem, index, list) {

                                    var idTalk = elem.idTalk;
                                    var lastTalkMessage = _.last(elem.messages);
                                    var lastDateUserRead = function () {
                                        var foundLastReadRow = _.find(userLastMessageReads, function (elemLastRead) {
                                            return (elemLastRead.idTalk == idTalk);
                                        });

                                        if (foundLastReadRow) {
                                            return foundLastReadRow.dateRead;
                                        }
                                        else {
                                            return new Date(1900, 1, 1);
                                        }
                                    }();
                                    var lastDateUserWrite = function () {
                                        var foundLastWriteRow = _.find(userLastMessageWrites, function (elemLastWrite) {
                                            return (elemLastWrite.idTalk == idTalk);
                                        });

                                        if (foundLastWriteRow) {
                                            return foundLastWriteRow.dateWrite;
                                        }
                                        else {
                                            return new Date(1900, 1, 1);
                                        }
                                    }();



                                    var userReadAllMessages = (lastDateUserRead >= lastTalkMessage.datePosted) || (lastTalkMessage.idPeople == requestIdentityUser.idPeople);
                                    var userAnsweredLast = lastDateUserWrite >= lastTalkMessage.datePosted;

                                    if (params.filter.lastMessageStatus == helpdeskCrossLayer.talkStatus.notRead) {
                                        // Remove from the resultset those items already read
                                        if (userReadAllMessages) {
                                            idTalksToRemove.push(idTalk);
                                        }
                                    }

                                    if (params.filter.lastMessageStatus == helpdeskCrossLayer.talkStatus.pendingAnswer) {
                                        // remove from the resultset those items where last 
                                        // message was posted by someone different than identity user
                                        if (userAnsweredLast) {
                                            idTalksToRemove.push(idTalk);
                                        }
                                    }

                                    if (params.filter.lastMessageStatus == helpdeskCrossLayer.talkStatus.Ok) {

                                    }

                                });



                                if (idTalksToRemove.length > 0) {

                                    talkIdsArray = _.difference(talkIdsArray, idTalksToRemove);


                                }
                            }

                            var page = params.page;
                            var pageSize = params.pageSize;
                            var queryFilter = function () {
                                return {
                                    idTalk: {
                                        $in: talkIdsArray
                                    }
                                };
                            }();
                            var query = HelpdeskTalkModel.find(queryFilter).skip((page * pageSize)).limit(pageSize).sort({ dateLastMessage: 'desc' });
                            var queryCount = HelpdeskTalkModel.find(queryFilter).count();

                            HelpdeskMessageModel
                                .find({
                                    idTalk: { $in: talkIdsArray },
                                }, function (e, allTalkMessages) {

                                    if (e) return cb(e, null);

                                    query.exec(function (e, talkArray) {

                                        if (e) return cb(e, null);

                                        queryCount
                                            .exec(function (e, talkCount) {

                                                if (e) return cb(e, null);

                                                var dataResult = new DataResultPaginated();
                                                dataResult.isValid = true;
                                                dataResult.data.totalRows = talkCount;
                                                dataResult.data.page = page;
                                                dataResult.data.pageSize = pageSize;
                                                dataResult.data.data = _.map(talkArray, function (value, index, list) {
                                                    return {
                                                        idTalk: value.idTalk,
                                                        subject: value.subject,
                                                        dateLastMessage: value.dateLastMessage, // this._fakeMessagesGetDateLastMessage(talkArray[i].idTalk),
                                                        nMessagesUnread: function () {

                                                            var userLastReadMessage = _.find(userLastMessageReads, function (elem) {
                                                                return elem.idTalk == value.idTalk;
                                                            });
                                                            var userLastReadDate = function () {

                                                                if (userLastReadMessage) {
                                                                    return userLastReadMessage.dateRead;
                                                                }
                                                                else {
                                                                    // current user has not been read any message
                                                                    return value.dateCreated;
                                                                }

                                                            }();
                                                            var talkMessages = _.filter(allTalkMessages, function (elem) {
                                                                return elem.idTalk == value.idTalk;
                                                            });
                                                            var talkMessagesUnread = _.filter(talkMessages, function (elem) {
                                                                //return elem.datePosted > userLastReadDate;

                                                                return ((elem.datePosted > userLastReadDate) &&
                                                                        (elem.idPeople !== requestIdentityUser.idPeople));
                                                            });

                                                            return talkMessagesUnread.length;
                                                        }()
                                                    };
                                                });

                                                cb(null, dataResult);
                                            });
                                    });
                                });
                        });
                    });
            });
    };
    HelpdeskAPIController.prototype._fakeMessageObjectToViewModel = function (currentUserIdPeople, peopleInvolvedDetailsArray, message) {

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

    };
    HelpdeskAPIController.prototype._userCanAccessTalk = function (idPeople, idTalk, cb) {

        this._talkGetPeopleInvolved(idTalk,
            function (e, peopleInvolved) {

                if (e) return cb(e, null);

                var evens = _.filter(peopleInvolved, function (element) { return element.idPeople == idPeople; });

                cb(null, evens.length > 0, peopleInvolved);

            });
    };
    HelpdeskAPIController.prototype._userRequestCanAccessTalk = function (req, idTalk, cb) {
        this._userCanAccessTalk(req.user.idPeople, idTalk, cb);
    };
    HelpdeskAPIController.prototype._userLastReadUpdate = function (model, cb) {

        //new HelpdeskPeopleLastReadModel({
        //    idTalk: idTalk,
        //    idPeople: req.user.idPeople,
        //    idMessage: newMessageRead.idMessage,
        //    dateRead: new Date()
        //}).save(function (e, talkObject, numberAffected) {
        //    returnResult();
        //});



        HelpdeskPeopleLastReadModel.findOne({
            idTalk: model.idTalk,
            idPeople: model.idPeople
        }, function (e, lastRead) {

            if (e) return cb(e, null);

            if (lastRead) {

                HelpdeskPeopleLastReadModel
                    .findByIdAndUpdate(
                        lastRead._id,
                        {
                            $set: {
                                idMessage: model.idMessage,
                                dateRead: model.dateRead
                            }
                        },
                        function (e, lastReadUpdated) {
                            if (e) return cb(e, null);

                            cb(null, lastReadUpdated, 1);
                        });

            } else {

                new HelpdeskPeopleLastReadModel(model)
                    .save(function (e, lastReadObject, numberAffected) {

                        if (e) return cb(e, null);

                        cb(null, lastReadObject, numberAffected);

                    });
            }
        });
    };
    HelpdeskAPIController.prototype._userLastWriteUpdate = function (model, cb) {

        //new HelpdeskPeopleLastReadModel({
        //    idTalk: idTalk,
        //    idPeople: req.user.idPeople,
        //    idMessage: newMessageRead.idMessage,
        //    dateWrite: new Date()
        //}).save(function (e, talkObject, numberAffected) {
        //    returnResult();
        //});


        HelpdeskPeopleLastWriteModel.findOne({
            idTalk: model.idTalk,
            idPeople: model.idPeople
        }, function (e, lastWrite) {

            if (e) return cb(e, null);

            if (lastWrite) {

                HelpdeskPeopleLastWriteModel
                    .findByIdAndUpdate(
                        lastWrite._id,
                        {
                            $set: {
                                idMessage: model.idMessage,
                                dateWrite: model.dateWrite
                            }
                        },
                        function (e, lastWriteUpdated) {
                            if (e) return cb(e, null);

                            cb(null, lastWriteUpdated, 1);
                        });


            } else {
                new HelpdeskPeopleLastWriteModel(model)
                    .save(function (e, lastWriteObject, numberAffected) {

                        if (e) return cb(e, null);

                        cb(null, lastWriteObject, numberAffected);

                    });
            }
        });
    };
    HelpdeskAPIController.prototype._messageResultToViewModel = function (req, filter, peopleInvolvedDetails, messageArray, cb) {

        var dataResult = new DataResultPaginated();

        for (var i = (filter.page * filter.pageSize) ; i < ((filter.page * filter.pageSize) + filter.pageSize) ; i++) {
            if (i < messageArray.length) {
                dataResult.data.data.push(this._fakeMessageObjectToViewModel(req.user.idPeople, peopleInvolvedDetails, messageArray[i]));
            }
        }


        dataResult.isValid = true;
        dataResult.data.totalRows = messageArray.length;
        dataResult.data.page = filter.page;
        dataResult.data.pageSize = filter.pageSize;

        cb(null, dataResult);
    };
    HelpdeskAPIController.prototype._fakeDataGridTalkGetByIdForEdit = function (req, idTalk, cb) {

        try {


            var self = this;
            var i18n = req.i18n;
            var dataResult = null;

            HelpdeskTalkModel.findOne({
                idTalk: idTalk
            }, function (e, talk) {

                if (e) return cb(e, null);

                if (talk === null) {
                    cb(null, new DataResult(false, i18n.__("Helpdesk.Talks.TalkNotFound")));
                }
                else {

                    self._userRequestCanAccessTalk(req, idTalk,
                        function (e, hasPermission, peopleInvolved) {

                            if (e) return cb(e, null);

                            var customerInfo = function () {
                                for (var i = 0; i < peopleInvolved.length; i++) {
                                    if (peopleInvolved[i].isEmployee === false) {
                                        return {
                                            customerId: peopleInvolved[i].idPeople,
                                            customerName: peopleInvolved[i].name
                                        };
                                    }
                                }
                                return null;
                            }();


                            //var dataObj = myUtils.extendDeep({}, talk);
                            var dataObj = {
                                idTalk: talk.idTalk,
                                subject: talk.subject,
                                dateLastMessage: talk.dateLastMessage,
                                editData: {
                                    idTalk: talk.idTalk,
                                    subject: talk.subject,
                                    dateLastMessage: talk.dateLastMessage,
                                    customerInfo: customerInfo
                                }
                            };

                            cb(null, new DataResult(true, "", dataObj));
                        });
                }
            });

        }
        catch (e) {
            cb(e, null);
        }
    };
    HelpdeskAPIController.prototype._searchPeoplePaginated = function (mongooseFilter, page, pageSize, mapItemCallback, cb) {

        var query = HelpdeskPeopleModel.find(mongooseFilter);
        var queryCount = HelpdeskPeopleModel.find(mongooseFilter).count();

        query
            .skip((page * pageSize))
            .limit(pageSize)
            .exec(function (e, people) {

                if (e) return cb(e, null);

                queryCount
                    .exec(function (e, peopleCount) {

                        if (e) return cb(e, null);

                        var dataResult = new DataResultPaginated();
                        dataResult.isValid = true;
                        dataResult.data.totalRows = peopleCount;
                        dataResult.data.page = page;
                        dataResult.data.pageSize = pageSize;
                        dataResult.data.data = _.map(people, mapItemCallback);

                        cb(null, dataResult);
                    });
            });
    };
    HelpdeskAPIController.prototype.reqCredentialsCheck = function (req, username, password, callback) {

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
    };
    HelpdeskAPIController.prototype.isAuthenticated = function (req, res, next) {

        //  when using basic auth passports sends header WWW-Authenticate
        //  which forces browser to show a dialog box asking for user credentials 
        //  

        //passport.authenticate('basic', {
        //    session: false
        //})(req, res, next);

        // I use a custom callback on passport baic auth
        // avoiding this header to be sent

        passport.authenticate(
            'helpdeskStrategy', {
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


    };
    HelpdeskAPIController.prototype.testMethodInitDb = function (cb) {

        if (this._isInTestMode === true) {

            var self = this;
            var dataToModel = function (all) {

                var employeeCurrent = all.filter(function (element) {
                    return element.isEmployee === true;
                })[0];
                var employeeAnother = all.filter(function (element) {
                    return element.isEmployee === true;
                })[1];
                var employeeDefault = all.filter(function (element, elementIndex, elementsList) {

                    var isDefaultEmployee = (element.isEmployee === true) && (element.idPersonBackOffice == self._testEmployeeDefaultIdBackOffice);

                    if (isDefaultEmployee) {
                        //all[elementIndex].name = "Default Employee/ Empleado por defecto";
                    }

                    return isDefaultEmployee;

                })[0];
                var customerCurrent = all.filter(function (element) {
                    return element.isEmployee === false;
                })[0];
                var customerAnother = all.filter(function (element) {
                    return element.isEmployee === false;
                })[1];

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
                                name: "Empleado/Employee " + j,
                                cardId: new Array(11).join(j.toString()),
                                email: myUtils.stringFormatCSharp("{0}@something.com", new Array(6).join(j.toString()))
                            }).save());

                        }

                        for (var k = 0; k < pMax; k++) {

                            peopleSaved.push(new HelpdeskPeopleModel({
                                //idPeople: pMax + k,
                                idPersonBackOffice: k,    //identificaador de la persona en PEF_tb_personaFisica
                                isEmployee: false,
                                name: "Cliente/Customer " + k,
                                cardId: new Array(11).join(k.toString()),
                                email: myUtils.stringFormatCSharp("{0}@something.com", new Array(6).join(k.toString()))
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
        }

        else {
            return cb(new ErrorHandledModel(i18n.__("GeneralTexts.NotImplemented")));
        }

    };
    HelpdeskAPIController.prototype.talkSearch = function (req, params, cb) {

        if (!req.user.isEmployee) {
            this._talkSearchByCustomer(req, params, cb);
        }
        else {
            this._talkSearchByEmployee(req, params, cb);
        }

    };
    HelpdeskAPIController.prototype.talkAdd = function (req, dataItem, cb) {

        var self = this;

        this._employeeDefaultGet(req.user.idPeople, function (e, employeeDefault) {

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
    };
    HelpdeskAPIController.prototype.messageAdd = function (req, dataItem, cb) {


        var self = this;
        var dataResult = null;
        var modelErrors = [];

        if (((dataItem.message.trim() === '') === true)) {
            // do not validate
            // In case message is empty then fail silently at backend
            // as far as client validation should occur before arrive here

            //modelErrors.push({ key: "message", value: [i18n.__("Views.Crud.FieldRequired")] });
        }

        if (modelErrors.length > 0) {
            cb(null, new DataResult(false, req.i18n.__("Views.Crud.ErrorExistsInForm"), { modelState: modelErrors }));
        }
        else {

            self._userRequestCanAccessTalk(req, dataItem.idTalk,
                function (e, hasPermission, peopleInvolved) {


                    if (hasPermission) {

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

                                        self._userLastWriteUpdate({
                                            idTalk: messageObject.idTalk,
                                            idPeople: messageObject.idPeople,
                                            idMessage: messageObject.idMessage,
                                            dateWrite: new Date()
                                        }, function (e, lastWriteUpdate, lastWriteNumberAffected) {

                                            if (e) return cb(e, null);

                                            dataResult = new DataResult(true, "", messageObject);

                                            cb(null, dataResult);

                                        });
                                    });
                            });
                        });


                    }
                    else {
                        var dataResult = new DataResultPaginated();
                        dataResult.isValid = false;
                        dataResult.addMessage(req.i18n.__("GeneralTexts.PermissionDenied"));
                        cb(null, dataResult);
                    }


                });
        }
    };
    HelpdeskAPIController.prototype.messageGetAll = function (req, params, cb) {

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

        //var filter = params;
        var self = this;
        var idTalk = params.filter.idTalk;

        this._userRequestCanAccessTalk(req, idTalk, function (e, hasPermission, peopleInvolvedDetails) {

            if (e) return cb(e, null);

            if (hasPermission) {

                HelpdeskMessageModel.find({
                    idTalk: idTalk
                }, function (e, messagesByIdTalk) {

                    self._messageResultToViewModel(
                        req,
                        params,
                        peopleInvolvedDetails,
                        messagesByIdTalk,
                        function (e, dataResult) {

                            if (e) return cb(e, null);

                            var newMessageRead = _.last(messagesByIdTalk);

                            if (newMessageRead) {
                                self._userLastReadUpdate({
                                    idTalk: idTalk,
                                    idPeople: req.user.idPeople,
                                    idMessage: newMessageRead.idMessage,
                                    dateRead: new Date()
                                }, function (e, talkObject, numberAffected) {
                                    cb(null, dataResult);
                                });
                            }
                            else {
                                cb(null, dataResult);
                            }
                        });
                });
            }
            else {

                var dataResult = new DataResultPaginated();
                dataResult.isValid = false;
                dataResult.addMessage(req.i18n.__("GeneralTexts.PermissionDenied"));
                cb(null, dataResult);
            }
        });

    };
    HelpdeskAPIController.prototype.messageGetUnread = function (req, params, cb) {

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

        var self = this;
        var filter = params;
        var idTalk = filter.filter.idTalk;
        var idMessageLastRead = filter.filter.idMessageLastRead;

        this._userRequestCanAccessTalk(req, idTalk, function (e, hasPermission, peopleInvolvedDetails) {

            if (e) return cb(e, null);

            if (hasPermission) {

                var messageGetUnReadFromFilter = function (messageModelFilter) {


                    HelpdeskMessageModel.find(messageModelFilter,
                        function (e, messagesByIdTalk) {


                            var returnResult = function () {

                                self._messageResultToViewModel(
                                    req,
                                    filter,
                                    peopleInvolvedDetails,
                                    messagesByIdTalk,
                                    function (e, dataResult) {

                                        if (e) return cb(e, null);

                                        cb(null, dataResult);
                                    });

                            };
                            var newMessageRead = _.last(messagesByIdTalk);

                            if (newMessageRead) {
                                self._userLastReadUpdate({
                                    idTalk: idTalk,
                                    idPeople: req.user.idPeople,
                                    idMessage: newMessageRead.idMessage,
                                    dateRead: new Date()
                                }, function (e, talkObject, numberAffected) {
                                    returnResult();
                                });
                            }
                            else {
                                returnResult();
                            }
                        });


                };

                var messageModelFilter = {
                    idTalk: idTalk,
                    idPeople: {
                        $ne: req.user.idPeople
                    },
                    datePosted: { $gt: new Date(1900, 1, 1) }
                };

                if (idMessageLastRead !== undefined) {

                    HelpdeskMessageModel.findOne({
                        idMessage: idMessageLastRead
                    }, function (e, lastMessageRead) {

                        if (e) return cb(e, null);

                        if (lastMessageRead !== null) {
                            messageModelFilter.datePosted = { $gt: lastMessageRead.datePosted };
                        }

                        messageGetUnReadFromFilter(messageModelFilter);

                    });

                }
                else {
                    messageGetUnReadFromFilter(messageModelFilter);
                }

            }
            else {
                var dataResult = new DataResultPaginated();
                dataResult.isValid = false;
                dataResult.addMessage(req.i18n.__("GeneralTexts.PermissionDenied"));
                cb(null, dataResult);
            }
        });
    };
    /************************************************************
                        Methods for employee
    *************************************************************/
    HelpdeskAPIController.prototype.talkGetById = function (req, dataItem, cb) {

        var dataResult = null;


        this._fakeDataGridTalkGetByIdForEdit(req, dataItem.idTalk,
            function (e, dataResult) {
                if (e) return cb(error, null);

                cb(null, dataResult);

            });
    };
    HelpdeskAPIController.prototype.talkSavedByEmployee = function (req, dataItem, cb) {

        var self = this;

        this._talkSave(
            req.i18n,
            dataItem.isNew === true ? null : dataItem.formData.idTalk,
            dataItem.formData.subject,
            dataItem.formData.customerInfo.customerId,  // customerId
            req.user.idPeople, // employeeId
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
    HelpdeskAPIController.prototype.customerSearch = function (req, params, cb) {

        var dbFilter = { isEmployee: false };

        if ((params.filter.customerName) && (params.filter.customerName.trim() !== "")) {
            dbFilter.name = new RegExp(myUtils.stringFormatCSharp('{0}', params.filter.customerName), "i");
        }

        if ((params.filter.customerCardId) && (params.filter.customerCardId.trim() !== "")) {
            dbFilter.cardId = new RegExp(myUtils.stringFormatCSharp('{0}', params.filter.customerCardId), "i");
        }

        this._searchPeoplePaginated(
            dbFilter,
            params.page,
            params.pageSize,
            function (value, index, list) {
                return {
                    customerCardId: value.cardId,
                    customerId: value.idPeople,
                    customerName: value.name
                };
            },
            cb);

    };
    HelpdeskAPIController.prototype.employeeSearch = function (req, params, cb) {

        var dbFilter = { isEmployee: true };

        if ((params.filter.employeeName) && (params.filter.employeeName.trim() !== "")) {
            dbFilter.name = new RegExp(myUtils.stringFormatCSharp('{0}', params.filter.employeeName), "i");
        }

        if ((params.filter.employeeEmail) && (params.filter.employeeEmail.trim() !== "")) {
            dbFilter.email = new RegExp(myUtils.stringFormatCSharp('{0}', params.filter.employeeEmail), "i");
        }

        this._searchPeoplePaginated(
            dbFilter,
            params.page,
            params.pageSize,
            function (value, index, list) {

                return {
                    employeeId: value.idPeople,
                    employeeName: value.name,
                    employeeEmail: value.email
                };

            },
            cb);
    };

})(module);