(function (module) {

    "use strict";

    var usersController = require('../controllers/users');

    module.exports.setRoutes = function (app, log, authController) {


        app.get('/api/user', [
            authController.isAuthenticated,
            function (req, res, next) {
                usersController.getById(req.user.userId, function (err, userInfo) {
                    if (err) return next(err);

                    res.json({
                        email: userInfo.email
                    });

                    res.end();
                });
            }
        ]);

        app.post('/api/user', function (req, res, next) {
            var result = usersController.create(req, req.body, function (err, user) {
                if (err) return next(err);

                res.json(user);
            });
        });

        app.get('/api/users/confirmation/:tokenId', [
            function (req, res, next) {
                usersController.confirmEmail(
                    req,
                    req.params.tokenId,
                    function (err, confirmResult) {
                        if (err) return next(err);

                        res.json(confirmResult);
                    });
            }
        ]);

        app.put('/api/user/lastActivity', [
            //authController.isAuthenticated,
            function (req, res, next) {

                // If user is authenticated -> update user last activity 

                res.json({

                });

                res.end();
            }
        ]);

        app.get('/api/user/menu', [
            //authController.isAuthenticated, ????
            function (req, res, next) {


                var i18n = req.i18n;



                res.json([
                    {
                        url: "/user/logon/",
                        text: i18n.__("AccountResources.LogOn"),
                    },
                    {
                        url: "/home/",
                        text: i18n.__("GeneralTexts.Home")
                    },
                    {
                        url: "/about/",
                        text: i18n.__("GeneralTexts.About")
                    },
                    {
                        url: "/languages/",
                        text: i18n.__("GeneralTexts.Languages")
                    },
                    {
                        url: "/themes/",
                        text: i18n.__("GeneralTexts.SiteThemes")
                    },
                    {
                        text: "UI Controls",
                        childs: [
                            {
                                text: "Menu",
                                childs: [
                                    {
                                        url: "/uicontrols/menu/menuTree/",
                                        text: "Menu Tree"
                                    },
                                    {
                                        url: "/uicontrols/menu/menuSlides/",
                                        text: "Menu Slides"
                                    },
                                ]
                            },
                            {
                                text: "Grid widget",
                                childs: [
                                    {
                                        url: "/uicontrols/crud/crudGridSimple/",
                                        text: "Basic Grid"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudGridSearch/",
                                        text: "Search & paginate"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudGridSearchDirect/",
                                        text: "Search filter on top"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudGridPagination/",
                                        text: "Pagination config"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudScrollable/",
                                        text: "Scrollable"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudExpand/",
                                        text: "Expand grid & resize"
                                    },
                                ],
                            },
                            {
                                text: "Crud widget",
                                childs: [
                                    {
                                        url: "/uicontrols/crud/crudFormSimple/",
                                        text: "CRUD Simple form"
                                    },
                                    {
                                        url: "/uicontrols/crud/crudFormExtended/",
                                        text: "CRUD Extended"
                                    },
                                ],
                            },
                        ]
                    },
                ]);

                res.end();
            }
        ]);


    };

})(module);