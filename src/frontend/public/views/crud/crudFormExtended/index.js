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

    "crudProductExtended.AjaxFake.js",
    "crudProductExtended.FilterModel.js",
    "crudProductExtended.FormModel.js",
    "crudProductExtended.GridModel.js",
    "crudProductExtended.Widget.js",
    "crudPage.js",
],
   function ($, jqUI, VsixMvcAppResult) {

       VsixMvcAppResult.View = {
           main: function () {

               jQuery('body')
                   .find('h1:first')
                       .html('Crud - Extended widget')
                   .end()
                   .find('div.ui-crudExtendedSample:first')
                       .crudExtendedSample()
                   .end();

           }
       };

       return VsixMvcAppResult;

   });