﻿/// <reference path="VsixMvcAppResult.A.Intellisense.js" />


var progressBoxSelector = "#progressFeedBack";

jQuery.widget("ui.widgetBase",
{
    options: {
        allowClose: false,      // creates a close button on the top-right of a widget
        allowCollapse: false,   // creates a collapse button
        isCollapsed: false,     // initializes as a collapsed item
        onCollapsed: function (e, isVisible) { },      // callback used when onCollapsed is fired 
    },
    _create: function () {

        this._super();

        jQuery(this.element).addClass(this.namespace + '-' + this.widgetName);


        this.progressInit();

        //this.log(this.element);
        //this.log(this.namespace + "." + this.widgetName + " -> create");
    },
    _init: function () {

        this._super();

        this.allowClose();
        this.allowCollapse();


        //this.log(this.element);
        this.log("{0}.{1}->Init->{2}".format(this.namespace, this.widgetName, jQuery(this.element)[0].className));
        





        var widgetName = this.namespace + '.' + this.widgetName;
        var dataWidgetInitialized = widgetName + ".IsInitialized";

        if (jQuery(this.element).data(dataWidgetInitialized) === undefined) {
            jQuery(this.element).data(dataWidgetInitialized, true);
        }
        else {
            throw new Error("Se ha intentado crear una instancia de widget que ya estaba creada. Podrian duplicarse eventos." + widgetName);
        }


    },
    destroy: function () {

        this._super();

        this.log(this.namespace + "." + this.widgetName + " -> destroy");

    },
    log: function (logMessage) {
        if (window.console) {
            console.log(logMessage);
        }
    },
    addCss: function (css) {
        // TODO: check 'head' exists
        jQuery('head').append(css);
    },
    cloneObject: function (obj) {
        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null === obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = this.cloneObject(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = this.cloneObject(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    },
    boxButtonsContainerGet: function () {
        var self = this;

        if(jQuery(this.element)
            .find('div.ui-widget-header:first')
                .find('div.ui-widget-boxButtons:first')
                .length === 0)
        {
            jQuery(this.element)
                .find('div.ui-widget-header:first')
                    .wrapInner("<div class='ui-widget-headerText'></div>")
                    .append('<div class="ui-widget-boxButtons"></div>');
        }

        return jQuery(this.element)
                .find('div.ui-widget-header:first')
                    .find('div.ui-widget-boxButtons:first');
    }, 
    allowClose: function () {

        if (this.options.allowClose) {

            var self = this;

            var $p = self.boxButtonsContainerGet();

            $p.append('<div class="ui-widget-close ui-corner-all ui-icon ui-icon-close"></div>')
              .find('div.ui-widget-close:first')
                .click(function () {
                    jQuery(self.element).toggle();
                })
                .show();
        }
    }, 
    allowCollapse: function () {

        if (this.options.allowCollapse) {
            var self = this;

            var collapseFunc = function () {
                var $content = jQuery(self.element).find('div.ui-widget-content');
                $content.toggle();
                jQuery(self.element).find('div.ui-widget-collapse:first').toggleClass('ui-icon-triangle-1-n', $content.is(':visible')).toggleClass('ui-icon-triangle-1-s', !$content.is(':visible'));
                self._trigger('onCollapsed', null, ($content.is(':visible') ? true : false));
            };

            var $p = self.boxButtonsContainerGet();

            $p.append('<div class="ui-widget-collapse ui-corner-all ui-icon ui-icon-triangle-1-s"></div>')
              .find('div.ui-widget-collapse:first')
              .click(function (e) {

                  var $c = jQuery(e.target);

                  if ($c.is("div") && $c.hasClass("ui-widget-collapse")) {
                      collapseFunc();
                  }
                  else {
                      if ($c.is("span") && $c.parents("div:first").hasClass("ui-widget-collapse")) {
                          collapseFunc();
                      }
                  }
              })
              .removeClass('ui-icon-triangle-1-n')
              .addClass('ui-icon-triangle-1-s')
              .show();

            if (self.options.isCollapsed) {
                collapseFunc();
            }
        }
    },


    progressInit: function () {

        // only one progressFeedback per page
        var self = this;

        if (jQuery(progressBoxSelector).length === 0) {
            jQuery('body').prepend('<div id="progressFeedBack" class="ui-progress-feedback ui-widget-overlay"><div class="ui-widget ui-widget-content ui-state-active ">Please wait while loading</div></div>');

            /*
            // these lines do not work on mobile
            jQuery(document)
                .click(function (e) {
                    jQuery(progressBoxSelector).find('div:first').css('top', (e.clientY + 20));
                });
            */
        }
    },
    progressShow: function (msg) {

        console.log("Info->" + msg);

        var $p = jQuery(progressBoxSelector);

        $p
        .addClass('ui-front')
        .find('div:first')
            .html(msg)
        .end()
        .show();
    },
    progressHide: function () {
        jQuery(progressBoxSelector).removeClass('ui-front').hide();
    },


    dfdFillCombo: function (selector, KeyValuePairArray) {
        var dfd = jQuery.Deferred();
        try {
            var $domObj = jQuery(selector);

            $domObj.find('option').remove();

            for (var i = 0; i < KeyValuePairArray.length; i++) {
                $domObj.append(jQuery("<option />").val(KeyValuePairArray[i].value).text(KeyValuePairArray[i].name));
            }

            dfd.resolve();
        }
        catch (e) {
            dfd.reject("Error inicializando el formulario: " + e.message);
        }
        return dfd.promise();
    }




});