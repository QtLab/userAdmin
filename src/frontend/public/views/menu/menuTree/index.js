define(["jquery", "jqueryui", "scripts/Template.App.Init", "scripts/Template.App.Ajax.Init", "scripts/Template.Widget.Menu.tree"],
   function ($, jqUI, VsixMvcAppResult) {

       VsixMvcAppResult.View = {
           main: function () {

               VsixMvcAppResult.Ajax.UserMenu(function (err, data) {

                   if (err === null) {
                       jQuery('ul.ui-menuTreeSample:first')
                            .menuTree({
                                dataBound: function (e) {
                                    jQuery(this).hide().removeClass('ui-helper-hidden').show('blind');
                                },
                                selected: function (e, liData) {
                                    console.log(liData);
                                }
                            })
                            .menuTree('bind', data);
                   }

               });
           }
       };

       return VsixMvcAppResult;

   });
