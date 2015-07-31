define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.ClientApp",


    "scripts/modules/crud",
    "/crud/crudCommon/crudSamplesCustomerData.js",
    "/crud/crudCommon/crudSamplesCustomerDefaultOptions.js",

],
   function ($, jqUI, clientApp, crudModule, customerAjax, crudDefaultOptions) {

       clientApp.view = {
           main: function () {

               var customerOptions = jQuery.extend({}, crudDefaultOptions.crudCustomerDefaultOptions(), {
                   gridFilterVisibleAlways: true,
               });

               jQuery('body')
                   .find('div.ui-customerCrud:first')
                       .crud(customerOptions)
                       .hide()
                       .removeClass('ui-helper-hidden')
                       .fadeIn()
                   .end();
           }
       };

       return clientApp;

   });