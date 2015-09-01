﻿define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.ClientApp",
    "/helpdesk/talks/employee/common/helpdeskCommon.js",
    "crossLayer/config"
],
function ($, jqUI, clientApp, helpdeskCommon, crossLayer) {

    clientApp.view = {
        main: function () {

            var navNext = function () {
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
                .end()
                .find('div.ui-helpdesk-needHelp')
                    .click(function () {
                        clientApp.template.loadByUrl('{0}{1}'.format(helpdeskCommon.helpdeskUrls.baseAddress, helpdeskCommon.helpdeskUrls.wiki()));
                    })
                .end()
                .removeClass('ui-helper-hidden');



            /**************************************
                Employee Selector
            *************************************/
            jQuery('ul.ui-userSelector-list:first')
                .find('li')
                    .click(function () {
                        var idPeople = jQuery(this).attr('data-user-id');
                        clientApp.utils.cookieSetForSession(crossLayer.cookies.helpdeskEmployeeId, idPeople);

                        jQuery(this)
                            .parents('ul:first')
                                .find('li')
                                    .removeClass('ui-state-active')
                                .end()
                            .end()
                            .addClass('ui-state-active');
                    })
                .end()
                .find('li[data-user-id="' + clientApp.utils.cookieGet(crossLayer.cookies.helpdeskEmployeeId) + '"]')
                    .addClass('ui-state-active')
                .end();



        }
    };

    return clientApp;

});