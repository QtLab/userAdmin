﻿(function(name, definition) {
    if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
        module.exports = definition();
    } else if (typeof define === 'function' && typeof define.amd === 'object') {
        define(definition);
    } else {
        this[name] = definition();
    }
})('roleValidator', function(roleValidator) {

    'use strict';

    roleValidator = {
        version: '0.0.1'
    };

    roleValidator.extend = function(name, fn) {
        roleValidator[name] = function() {
            var args = Array.prototype.slice.call(arguments);
            args[0] = roleValidator.toString(args[0]);
            return fn.apply(roleValidator, args);
        };
    };

    roleValidator.validate = function(obj, i18n, validator) {

        var result = {
            isValid: true,
            messages: []
        };

        try {

            if (
                (validator.toString(obj.name).trim() === '')
            ) {
                result.isValid = false;
                result.messages.push({
                    password: i18n.__("Invalid role name")
                });
            }
        } catch (e) {
            result.isValid = false;
            result.messages.push({
                0: i18n.__("Unhandled error")
            });
        }

        return result;
    };

    return roleValidator;

});