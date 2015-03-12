﻿/// <reference path="url/UrlHelper.js" />

// This file has been auto generated by T4 Text Templates
// Changes to this file may be overriden at compile time

jQuery(document).ready(function () {
    jQuery.ajaxSetup({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        beforeSend: function (xhr, settings) {

            var urlHelper = new UrlHelper(settings.url);

            if (urlHelper.hostname == window.location.hostname)
            {
                settings.url = new UrlHelper(settings.url).paramSet("appVersion", appVersion).href;
            }
            
            //xhr.setRequestHeader("appVersion", appVersion);
        }

    });
});

VsixMvcAppResult.Ajax = {};

VsixMvcAppResult.Ajax.ThemeSet = function (theme, onOK, onKO) {
    var jqxhr = jQuery.ajax({
        url: "/api/user/theme",
        type: "POST",
        data: JSON.stringify({
            theme: theme
        })
    })
        .done(function (data, textStatus, jqXHR) {
            onOK(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            onKO(jqXHR);
        });
};

VsixMvcAppResult.Ajax.CultureSet = function (culture, onOK, onKO) {
    var jqxhr = jQuery.ajax({
        url: "/api/user/culture",
        type: "POST",
        data: JSON.stringify({
            culture: culture
        })
    })
        .done(function (data, textStatus, jqXHR) {
            onOK(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            onKO(jqXHR);
        });
};

VsixMvcAppResult.Ajax.UserUpdateLastActivity = function (onOK, onKO, onComplete) {
    var jqxhr = jQuery.ajax({
        url: "/api/user/lastActivity",
        type: "PUT",
        data: {},
        //dataType: "html",
        cache: false
    })
        .done(function (data, textStatus, jqXHR) {
            onOK(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            onKO(jqXHR);
        })
        .always(function (jqXHR, textStatus, errorThrown) {
            onComplete();
        });
};

VsixMvcAppResult.Ajax.UserMenu = function (onOK, onKO, onComplete) {
    var jqxhr = jQuery.ajax({
        url: "/api/user/menu",
        type: "GET",
        data: {},
        //dataType: "html",
        cache: false
    })
        .done(function (data, textStatus, jqXHR) {
            onOK(data);
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            onKO(jqXHR);
        })
        .always(function (jqXHR, textStatus, errorThrown) {
            onComplete();
        });
};