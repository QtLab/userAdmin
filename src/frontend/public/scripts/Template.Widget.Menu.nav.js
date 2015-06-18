define([
    "jquery",
    "jqueryui",
    "handlebars",
    "history",
    "scripts/Template.App.Ajax.Init",
    "scripts/Template.Widget.Menu.slides"],
       function ($, jqUI, Handlebars, hist, VsixMvcAppResult) {


           jQuery.widget("ui.menuNav", jQuery.ui.widgetBase, {
               options: {
                   texts: {
                       loadingTmpl: "Loading template",
                       errLoadingTmpl: "Error loading template"
                   }
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
                   var $siteContent = jQuery('div.ui-siteContent:first');
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
                   var loadTemplate = function (State) {

                       var templUrl = State.hash;

                       console.log("removing page content");

                       $siteContent.empty();

                       console.log("geting html page content for " + templUrl);

                       // ask for the template
                       jQuery.ajax({
                           url: templUrl,
                           type: "GET",
                           dataType: "html",
                           cache: true,
                       })
                       .done(function (data, textStatus, jqXHR) {

                           var templatePartialCssFiles = "{{#each cssFiles}}<link href='{{this}}' rel='Stylesheet' type='text/css' />{{/each}}";
                           var template = Handlebars.compile(data + templatePartialCssFiles);
                           var templateContext = {};


                           console.log("geting page model content for " + templUrl + 'index.handlebars.json');

                           // ask for the template context
                           jQuery.ajax({
                               url: templUrl + 'index.handlebars.json',
                               type: "GET",
                               dataType: "json",
                               cache: false,    // view model MUST NOT be chached
                           })
                           .done(function (dataJson, textStatusJson, jqXHRJson) {

                               if (dataJson.Title) {
                                   jQuery('body')
                                       .find('h1:first')
                                           .html(dataJson.Title);
                               }

                               var html = template(jQuery.extend({}, dataJson, templateContext));

                               console.log("append html content");

                               $siteContent.html(html);

                               console.log("check ViewEntryPoint");

                               if (dataJson.ViewEntryPoint && dataJson.ViewEntryPoint !== null) {

                                   console.log("requiring ViewEntryPoint");

                                   require(
                                       /*
                                       1.- require will cache ViewEntryPoints
                                       2.- forcing views to execute viewEntryPoint."main" previously loaded
                                       3.- using urlArgs=bust+ (new Date()).getTime() is not an potion
                                            as far as would load every script again and again
                                       4.- best solution is to add .getTime() to viewEntryPoint url.
                                           This way viewEntryPoint will always be overriden to the last script loaded
                                           Bu keeps caching viewEntrypoint dependencies
                                       */
                                       [dataJson.ViewEntryPoint + "?_=" + (new Date()).getTime()],
                                       function (VsixMvcAppResult) {
                                           VsixMvcAppResult.View.main();
                                       },
                                       function (errRequiring) {
                                           console.error(errRequiring);
                                       });
                               }

                           })
                           .fail(function (jqXHR, textStatus, errorThrown) {

                               console.error(new Error("Error getting page model", {
                                   jqXHR: jqXHR,
                                   textStatus: textStatus,
                                   errorThrown: errorThrown
                               }));

                               // specific template context fail to load. 
                               // try transform with basic template context
                               var html = template(templateContext);
                               $siteContent.html(html);
                           })
                           .always(function () {
                               self.progressHide();
                           });

                       })
                       .fail(function (jqXHR, textStatus, errorThrown) {

                           console.error("Error lading template '{0}' ->".format(templUrl), {
                               jqXHR: jqXHR,
                               textStatus: textStatus,
                               errorThrown: errorThrown
                           });

                           $siteContent.html('<div class="ui-state-error ui-site-templateInfo">' + self.options.texts.errLoadingTmpl + ': {0} - {1} - {2} </div>'.format(jqXHR.status, textStatus, errorThrown));

                       })
                       .always(function () {
                           self.progressHide();
                       });

                   };

                   Handlebars.registerHelper('__', function (context, options) {

                       if (Object.keys(options.data.root.i18nTexts).indexOf(context) > -1) {
                           return options.data.root.i18nTexts[context];
                       }
                       else {
                           return context;
                       }
                   });


                   History.Adapter.bind(window, 'statechange', function () { // Note: We are using statechange instead of popstate

                       self.progressShow(self.options.loadingTmpl);

                       // Log the State
                       var State = History.getState(); // Note: We are using History.getState() instead of event.state
                       History.log('statechange:', State.data, State.title, State.url);


                       loadTemplate(State);
                   });




                   $panelMenu.hide();

                   $panelMenuList.menuSlides({
                       selected: function (e, templ) {

                           var templGetFunc = function () {

                               var templUrl = templ.url;

                               History.pushState(null, null, templUrl);

                               //loadTemplate(templUrl);
                           };

                           if ($panelMenuToggle.is(':visible')) {
                               panelMenuHide(function () {
                                   templGetFunc();
                               });

                               //panelMenuHide(setTimeout(function () {
                               //    templGetFunc();
                               //},
                               //500));
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
