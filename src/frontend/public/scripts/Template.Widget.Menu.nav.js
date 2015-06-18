define([
    "jquery",
    "jqueryui",
    "handlebars",
    "scripts/Template.App.Ajax.Init",
    "scripts/Template.Widget.Menu.slides"],
       function ($, jqUI, Handlebars, VsixMvcAppResult, wSlides) {


           jQuery.widget("ui.menuNav", jQuery.ui.widgetBase, {
               options: {
                   //texts: {
                   //    loadingTmpl: "Loading template",
                   //    errLoadingTmpl: "Error loading template"
                   //}
               },
               _create: function () {
                   this._super();
               },
               _init: function () {

                   this._super();

                   this._initMenuNav();
               },
               destroy: function () {
                   this._super();
               },
               _errMsgSet: function (selector, msg) {
                   jQuery(selector)
                       .append("<div class='userActiviyErrMsg ui-state-error'></div><div class='ui-helper-clearfix'></div>")
                       .find("div.userActiviyErrMsg:first")
                       .html(msg);
               },
               
               _initMenuNav: function () {

                   //TODO: load async Menu based on user identity
                   var self = this;
                   var $sitePage = jQuery('div.ui-sitePage:first');
                   
                   var $panelMenu = jQuery('#panelMenu');
                   var $panelMenuList = jQuery($panelMenu).find('div.ui-menuBase:first');
                   var $panelMenuToggle = jQuery('div.ui-mainMenuToggle');
                   var panelMenuHide = function (cb) {
                       $sitePage.show();
                       $panelMenu.hide('slide', function () {
                           $panelMenu.removeClass('ui-front');

                           if (jQuery.isFunction(cb)) {
                               cb();
                           }
                       });
                   };
                   var panelMenuShow = function (cb) {
                       $panelMenu
                           .addClass('ui-front')
                           .show('drop', function () {
                               $sitePage.hide();

                               if (jQuery.isFunction(cb)) {
                                   cb();
                               }
                           });
                   };
                   var panelMenuToggleOnClick = function (cb) {
                       if ($panelMenu.is(':visible')) {
                           panelMenuHide(cb);
                       }
                       else {
                           panelMenuShow(cb);
                       }
                   };
                   



                   $panelMenu.hide();

                   $panelMenuList.menuSlides({
                       selected: function (e, templ) {

                           var templGetFunc = function () {
                               self._trigger('selected', null, templ);
                           };

                           if ($panelMenuToggle.is(':visible')) {
                               panelMenuHide(function () {
                                   templGetFunc();
                               });
                           }
                           else {
                               templGetFunc();
                           }
                       },
                       done: function (e) {
                           self._initMenuSelected($panelMenuList);
                       }
                   });


                   /* Begin Ensure panel animations:
                       1.- prevent clicking twice the same toggle button before panel animations are done
                       2.- prevent adding click events twice
                   */
                   var panelMenuToggleClickBind = null;

                   panelMenuToggleClickBind = function () {
                       $panelMenuToggle
                           .one('click', function () {
                               $panelMenuToggle.unbind('click');
                               panelMenuToggleOnClick(function () {
                                   panelMenuToggleClickBind();
                               });
                           });
                   };

                   panelMenuToggleClickBind();
                   /* End Ensure panel animations */


                   VsixMvcAppResult.Ajax.UserMenu(
                       function (data, textStatus, jqXHR) {
                           $panelMenuList.menuSlides('bind', data);
                       },
                       function (jqXHR, textStatus, errorThrown) {
                           self._errMsgSet($panelMenu, VsixMvcAppResult.Resources.unExpectedError);
                       },
                       function () {
                           self._trigger('complete', null, null);
                       });
               },
               _initMenuSelected: function ($widgetMenuList) {

                   var pathName = location.pathname;

                   $widgetMenuList.menuSlides('select', function (menuItem) {

                       if (menuItem.url == pathName) {
                           return true;
                       }
                   });


               },

           });


       });
