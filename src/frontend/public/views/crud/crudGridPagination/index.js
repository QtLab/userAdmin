﻿define([
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

               var crudOptions = jQuery.extend(
                   {},
                   crudCustomerDefaultOptions(),
                   {
                       gridPagerInit: function () {
                           return {
                               pageSize: 30,
                               pagerTop: {
                                   paginationShow: true,
                                   totalRowsShow: true,
                                   pageSizeShow: true,
                               },
                               //default config for pagerBottom
                               //pagerBottom: {
                               //    paginationShow: true,
                               //    totalRowsShow: true,
                               //    pageSizeShow: true,
                               //}
                           };
                       },
                   });

               jQuery('body')
                   .find('h1:first')
                       .html('Crud widget - Grid pagination config')
                   .end()
                   .find('div.ui-customerCrud:first')
                       .crud(crudOptions)

                       .hide()
                       .removeClass('ui-helper-hidden')
                       .fadeIn()
                   .end();


           }
       };

       return VsixMvcAppResult;

   });