define([
    "scripts/Template.Widget.Page",
    "scripts/Template.App.Widgets.Init.js"
],
function (wPage, VsixMvcAppResult) {

           VsixMvcAppResult.Widgets.PageOptions = {
               selector: null,
               cultureGlobalization: null,
               cultureDatePicker: null,
               _initCallbacks: [],
               onInit: function (callBack) {
                   this._initCallbacks.push(callBack);
               },
               Init: function () {
                   var self = this;
                   jQuery(this.selector).page({
                       cultureGlobalization: this.cultureGlobalization,
                       cultureDatePicker: this.cultureDatePicker,
                       initComplete: function () {

                           for (var i = 0; i < self._initCallbacks.length; i++) {
                               self._initCallbacks[i]();
                           }
                       }
                   });
               }
           };

           return VsixMvcAppResult;

       });