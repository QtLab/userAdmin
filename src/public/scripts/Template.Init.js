﻿/// <reference path="VsixMvcAppResult.A.Intellisense.js" />
if (!window.console) {
    console = {
        log: function (msg) {

        }
    };
}

// C# String.Format
if (!String.prototype.format) {
    String.prototype.format = function () {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

/*jslint evil: true */
String.prototype.toDateFromAspNet = function () {
    var dte = eval("new " + this.replace(/\//g, '') + ";");
    dte.setMinutes(dte.getMinutes() - dte.getTimezoneOffset());
    return dte;
};

String.prototype.toBoolean = function () {
    return (/^true$/i).test(this);
};

function parseBoolean(value) {
    return value.toBoolean();
}

var VsixMvcAppResult = {};


