﻿define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.ClientApp",
    "/helpdesk/talks/employee/common/helpdeskCommon.js",
],
function ($, jqUI, clientApp, helpdeskCommon) {

    clientApp.view = {
        breadcrumb: function () {

            return [{
                "title": clientApp.i18n.texts.get("GeneralTexts.BackToPreviousPage"),
                "url": function () { History.back(); return false; }
            }];

        },

        main: function () {

            var navNext = function () {
                console.log('{0}{1}'.format(helpdeskCommon.helpdeskUrls.baseAddress, helpdeskCommon.helpdeskUrls.history()));
                clientApp.template.loadByUrl('{0}{1}'.format(helpdeskCommon.helpdeskUrls.baseAddress, helpdeskCommon.helpdeskUrls.history()));
            };

            jQuery('div.ui-helpdesk-talks-wellcome-container:first')
                .find('button:first')
                    .button()
                    .click(function () {
                        navNext();
                    })
                .end()
                .find('i.ui-helpdesk-talks-wellcome-userIcon')
                    .click(function () {
                        navNext();
                    })
                .end();

            
        }
    };

    return clientApp;

});