(function (module) {

    "use strict";

    module.exports = LangController;

    var config = require('../libs/config');
    var PreferenceSetter = require('./classes/preferenceSetter.js');

    function LangController() {
        PreferenceSetter.apply(this, arguments);
    }
    LangController.prototype = new PreferenceSetter();
    LangController.prototype.getAll = function (req, cb) {

        this.data = [
                {
                    id: "es",
                    name: req.i18n.__("GeneralTexts.Language.Spanish")
                },
                {
                    id: "cat",
                    name: req.i18n.__("GeneralTexts.Language.Catalan")
                },
                {
                    id: "en",
                    name: req.i18n.__("GeneralTexts.Language.English")
                }];

        for (var i = 0; i < this.data.length; i++) {
            this.data[i].selected = this.data[i].id == this.cookieValueGet(req);
        }

        cb(null, this.data);

    };
    LangController.prototype.initRequest = function (req, res) {
        req.i18n.setLocaleFromCookie();
        PreferenceSetter.prototype.initRequest.call(this, req, res);
    };
    LangController.prototype.cookieName = config.get('i18n:cookieName');
    LangController.prototype.cookieValueGet = function (req) {
        if (req.cookies[this.cookieName]) {
            return req.cookies[this.cookieName];
        }
        else {
            return config.get('i18n:locales')[0];
        }
    };

})(module);
