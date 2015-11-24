﻿define([
    "jquery",
    "jqueryui",
    "scripts/Template.Widget.HelpdeskChat",
    "scripts/Template.App.ClientApp",
    "scripts/Template.Class.UrlHelper",
    "helpdesk/employee/common/helpdeskCommonEmployee",
    "helpdesk/employee/common/helpdeskCrudFakeDataEmployee",
],
function ($, jqUI, HelpdeskChatWidget, clientApp, UrlHelper, helpdeskCommon, crudAjaxOpts) {

    clientApp.view = {
        breadcrumb: function () {

            return [{
                "title": clientApp.i18n.texts.get("Helpdesk.Talks.Summary.Title"),
                "url": "{0}{1}".format(helpdeskCommon.helpdeskUrls.baseAddress, helpdeskCommon.helpdeskUrls.history())
            }];

        },
        main: function (context) {

            jQuery('#employeeHelpdeskChat')
                .helpdeskChat({
                    idTalk: function () {

                        var idTalk = new UrlHelper().query.parsed.idTalk;

                        if (idTalk === undefined) {
                            console.error(new Error('Argument exception: missing idTalk from query string'));
                        }

                        return new UrlHelper().query.parsed.idTalk;

                    }(),
                    talkTitle: clientApp.i18n.texts.get("Helpdesk.Talks.Message.Title"),
                    talkDescription: context.viewModel.talkTitle,
                    talkHelpUse: clientApp.i18n.texts.get("Helpdesk.Talks.Chat.HelpUseTextEmployee"),
                    messageAdd: crudAjaxOpts.ajax.messageAdd,
                    messageGetAll: crudAjaxOpts.ajax.messageGetAll,
                    messageGetUnread: crudAjaxOpts.ajax.messageGetUnread,
                });
        }
    };

    return clientApp;

});