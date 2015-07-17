﻿define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.Init",
    "scripts/crud/common.widget.crud.base",
    "scripts/Template.Widget.Model"
],
       function ($, jqUI, clientApp) {

           jQuery.widget("ui.crudFilter", jQuery.ui.crudBase,
           {
               options: {
                   page: 0,
                   pageSize: 10,
                   sortBy: "",
                   sortAscending: false,
                   filterButtonsInit: function (self, defaultButtons) {
                       return defaultButtons;
                   },
                   gridFilterVisibleAlways: false,

                   texts: {
                       buttonCancelText: clientApp.i18n.texts.get("Template.Widget.Crud.Cancel"),
                       buttonSearchText: clientApp.i18n.texts.get("Template.Widget.Crud.Search"),
                   }
               },
               _create: function () {

                   this._super();

                   jQuery(this.element).widgetModel({
                       modelItems: this.options.model
                   });

                   jQuery(this.element)
                       .addClass('ui-crudFilter ui-helper-hidden')
                           .children()
                           .wrapAll('<div class="ui-crudFilter-form " />')
                           .end()
                   .prepend('<div class="ui-crudFilter-buttons ui-ribbonButtons  ui-state-default"></div>');

                   this._filterButtonsInit();
               },
               _init: function () {

                   this._super();

                   this._done();
               },
               _done: function () {
                   this._trigger('done', null, null);
               },
               _filterButtonsInit: function () {

                   var self = this;

                   var defaultButtonsArray = [];

                   if (!self.options.gridFilterVisibleAlways) {
                       defaultButtonsArray.push(
                       {
                           id: "cancel",
                           text: self.options.texts.buttonCancelText,
                           cssClass: "ui-cancel-button ui-state-default",
                           icon: "ui-icon-circle-arrow-w",
                           click: function (self) {
                               self._trigger('cancel', null, null);
                           }
                       });
                   }

                   defaultButtonsArray.push(
                   {
                       id: "filter",
                       text: self.options.texts.buttonSearchText,
                       cssClass: "ui-search-button ui-state-default",
                       icon: "ui-icon-search",
                       click: function (self) {
                           var filter = self.val();
                           self._trigger('change', null, filter);
                       }
                   });

                   var defaultButtons = self.options.filterButtonsInit(this, defaultButtonsArray);

                   var $buttonsBox = jQuery(this.element).find('div.ui-crudFilter-buttons:first');

                   for (var i = 0; i < defaultButtons.length; i++) {
                       this._initButton(this, defaultButtons[i], $buttonsBox);
                   }

                   jQuery($buttonsBox).append('<div class="ui-helper-clearfix"></div>');
               },
               destroy: function () {

                   this._super();

                   ///TODO: unbind select change events + button events
               },
               val: function () {

                   var self = this;

                   var model = {

                       filter: jQuery(this.element).widgetModel('valAsObject'),
                       page: 0,
                       pageSize: this.options.pageSize,
                       sortBy: this.options.sortBy,
                       sortAscending: this.options.sortAscending
                   };

                   return model;
               }
           });


       });