﻿/*******************************************************************************
                                HELPER PUBLIC METHODS
********************************************************************************/

VsixMvcAppResult.Widgets.PageOptions = {
    selector: null,
    cultureSelected: null,
    cultureGlobalization: null,
    cultureDatePicker: null,
    defaultTheme: null,
    _initCallbacks: [],
    onInit: function(callBack) {
        this._initCallbacks.push(callBack);
    },
    Init: function() {
        var self = this;
        jQuery(this.selector).page({
            allowCssClasses: this.allowCssClasses,
            cultureSelected: this.cultureSelected,
            cultureGlobalization: this.cultureGlobalization,
            cultureDatePicker: this.cultureDatePicker,
            defaultTheme: this.defaultTheme,
            initComplete: function() {

                for (var i = 0; i < self._initCallbacks.length; i++) {
                    self._initCallbacks[i]();
                }
            }
        });
    }
};


/*******************************************************************************
                                WIDGET DEFINITION
********************************************************************************/

jQuery.widget("ui.page", jQuery.ui.widgetBase, {
    options: {
        cultureGlobalization: null,
        cultureDatePicker: null,
        defaultTheme: null
    },
    _init: function() {

        this._super();

        this.initAjaxProgress();
        this.initGlobalization();
        this.initValidate();
        this.initUserActivity();
    },
    _create: function() {
        this._super();
    },
    destroy: function() {
        
        this._super();

    },
    initUserActivity: function () {

        var self = this;

        jQuery(this.element).find('div[data-widget="userActivity"]:first').userActivity({
            complete: function () {
                //self.initJQueryzer();
                self._trigger('initComplete', null, null);
            }
        });
    },
    initAjaxProgress: function() {
        VsixMvcAppResult.Widgets.AjaxProgress().Create();
    },
    initFooter: function() {
        jQuery('div.ui-siteFooter').widgetBase();
    },
    initGlobalization: function() {
        /* Globalization Initializaer */
        Globalize.culture(this.options.cultureGlobalization);
        //jQuery('div.sample').append('<span>' + Globalize.format(3899.888, "c") + '</span><br/>');
        //jQuery('div.sample').append('<span>' + Globalize.format(new Date(2011, 12, 25), "D") + '</span><br/>');
        //jQuery('div.sample').append('<span>' + Globalize.format(45678, "n0") + '</span><br/>');
        jQuery.datepicker.setDefaults(jQuery.datepicker.regional[this.options.cultureDatePicker]);
    },
    initValidate: function() {

        jQuery.validator.setDefaults({
            debug: false,
            errorClass: "ui-state-error"
        });

        jQuery.validator.methods.number = function (value, element) {
            if (Globalize.parseFloat(value)) {
                return true;
            }
            return false;
        };
    },
    //initJQueryzer: function() {

    //    VsixMvcAppResult.Widgets.jQueryzer(this.element);

    //    jQuery(this.element)
    //        .find(':input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea')
    //        .addClass('ui-widget-content ui-corner-all')
    //        .focus(function() {
    //            jQuery(this).addClass('ui-state-focus');
    //        })
    //        .blur(function() {
    //            jQuery(this).removeClass('ui-state-focus');
    //        })
    //        .end()
    //        .find('fieldset')
    //        .addClass('ui-widget-content  ui-corner-all')
    //        .end()
    //        .find('hr')
    //        .addClass('ui-widget-content');
    //}
});