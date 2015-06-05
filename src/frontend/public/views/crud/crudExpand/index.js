define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.Init",

    "scripts/crud/common.widget.fieldItem",
    "scripts/crud/common.widget.crud.base",
    "scripts/crud/common.widget.crud",
    "scripts/crud/common.widget.crud.filter",
    "scripts/crud/common.widget.crud.grid",
    "scripts/crud/common.widget.crud.form",
    "scripts/crud/common.widget.grid.pagination",

    "/uicontrols/crud/crudSamplesCustomerData.js",
    "/uicontrols/crud/crudSamplesCustomerDefaultOptions.js",

],
   function ($, jqUI, VsixMvcAppResult) {

       VsixMvcAppResult.View = {
           main: function () {

               var customerOptions = jQuery.extend({}, crudCustomerDefaultOptions(), {
                   gridPagerInit: function () {
                       return {
                           pageSize: 30,
                       };
                   },
               });

               jQuery('body')
                   .find('h1:first')
                       .html('Crud widget - Grid expands to window height & resize')
                   .end()
                   .find('div.ui-customerCrud:first')
                       .crud(customerOptions)

                       .hide()
                       .removeClass('ui-helper-hidden')
                       .fadeIn()
                   .end();

               var $gridControl = jQuery('div.ui-crudCrud-gridControl:first');

               var gridControlResize = function () {

                   function convertEmToPixels(value) {
                       return value * (parseFloat(getComputedStyle(document.documentElement).fontSize));
                   }

                   $gridControl.height(jQuery(window).height() - convertEmToPixels(11.7));
               };

               jQuery(window)
                   .resize(function (e, ui) {
                       gridControlResize();
                   });

               gridControlResize();

           }
       };

       return VsixMvcAppResult;

   });