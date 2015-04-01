﻿
jQuery.widget("ui.crudBase", jQuery.ui.commonBaseWidget,
{
    options: {
        errorDOMId: null,
        messagesDOMId: null
    },
    _create: function () {

        this._super();
    },
    _init: function () {
        this._super();
    },
    destroy: function () {

        this._super();
    },
    _initButton: function (widgetInstance, theButtonOptions, buttonsBox) {

        var self = this;

        var theButton = jQuery('<button type="button" class="{0}">{1}</button>'
                            .format(theButtonOptions.cssClass,
                                    theButtonOptions.text));

        jQuery(buttonsBox).append(theButton);

        theButton
            .button({
                icons: {
                    primary: theButtonOptions.icon
                }
            });

        if (theButtonOptions.click) {
            theButton.click(function () {
                theButtonOptions.click(widgetInstance);
            });
        }
    },
    errorInit: function (parent) {

        if (parent) {

            var errorCustomDOMClassName = this.namespace + '-' + this.widgetName + '-errDisplayBox';
            var highlightCustomDOMClassName = this.namespace + '-' + this.widgetName + '-highlightDisplayBox';


            var template = '<div class="ui-crud-error {0} ui-state-error ui-helper-hidden"></div>' +
                           '<div class="ui-crud-info {1} ui-state-highlight ui-helper-hidden"></div>';

            template = template.format(errorCustomDOMClassName, highlightCustomDOMClassName);

            jQuery(this.element).find(parent).append(template);

            this.options.errorDOMId = jQuery(this.element).find('div.' + errorCustomDOMClassName + ':first');
            this.options.messagesDOMId = jQuery(this.element).find('div.' + highlightCustomDOMClassName + ':first');

            this.errorHide();
            this.messageHide();
        }
    },
    errorDisplay: function (msg, cb) {

        console.log("Error->" + msg);

        jQuery(this.options.errorDOMId)
                .addClass('ui-state-error')
                .html(msg)
                .fadeTo('slow', 1, function () {
                    if (jQuery.isFunction(cb)) {
                        cb();
                    }
                });
    },
    errorHide: function (cb) {

        var self = this;

        jQuery(this.options.errorDOMId)
            .removeClass('ui-state-error')
            .html('')
            .fadeTo('slow', 0, function () {
                if (jQuery.isFunction(cb)) {
                    cb();
                }
            });
    },
    messageDisplay: function (msg, cb) {
        jQuery(this.options.messagesDOMId)
            .addClass('ui-state-highlight')
            .html(msg)
            .fadeTo('slow', 1, function () {
                if (jQuery.isFunction(cb)) {
                    cb();
                }
            });
    },
    messageHide: function (cb) {

        var self = this;

        jQuery(this.options.messagesDOMId)
            .removeClass('ui-state-highlight')
            .html('')
            .fadeTo('slow', 0, function () {
                if (jQuery.isFunction(cb)) {
                    cb();
                }
            });
    },
    messagedisplayAutoHide: function (msg, miliseconds) {

        var time = 3000;
        var self = this;

        if (miliseconds) {
            time = miliseconds;
        }

        this.messageDisplay(msg,
            function () {
                jQuery(self.options.messagesDOMId)
                    .delay(time)
                    .fadeTo(time, 0, function () { self.messageHide(); });
            });
    },
});

jQuery.widget("ui.crud", jQuery.ui.crudBase,
{
    options: {
        crudHeaderDomId: null,
        gridButtonsDOMId: null,
        gridDOMId: null,
        gridFilterDOMId: null,
        gridFilterObject: null,
        gridFilterVisibleAlways: false,
        gridFilterButtonsInit: function (widgetFilter, defaultButtons) {
            return defaultButtons;
        },
        formDOMId: null,


        gridCustomOptions: {},
        gridSearchMethod: null,
        gridFilterInit: function (crudWidget, filterOptions) {
            jQuery(crudWidget.options.gridFilterDOMId).crudFilter(jQuery.extend({}, filterOptions, { Model: crudWidget.options.filterModel }));
        },
        gridModel: [],
        gridViewCellBound: function (crudGridWidget, $row, $cell, dataItem, columnName) {

        },
        gridSearchForEditMethod: null,
        gridButtonsGet: function (crudWidget, defaultButtons) {
            return defaultButtons;
        },
        gridPagerInit: function () {
            // overrides default pagination mode
            return {
                pageSize: 10,
                pagerTop: {
                    paginationShow: false,
                    totalRowsShow: false,
                    pageSizeShow: false,
                },
                pagerBottom: {
                    paginationShow: true,
                    totalRowsShow: true,
                    pageSizeShow: true,
                }
            };
        },

        formInit: function (crudWidget, formOptions) {
            throw new Error(crudWidget.namespace + '.' + crudWidget.widgetName + ".formInit is an abstract method. Child class method must be implemented");
        },
    },
    _create: function () {

        var self = this;

        this._super();

        var gridFilterClass = 'ui-{0}Crud-filter'.format(this.widgetName);
        var gridButtonsClass = 'ui-{0}Crud-gridButtons'.format(this.widgetName);
        var gridControlClass = 'ui-{0}Crud-gridControl'.format(this.widgetName);
        var formControlClass = 'ui-{0}Crud-form'.format(this.widgetName);
        var templateGet = function () {

            var template = '<div class="ui-crud-messages ui-state-default ui-helper-hidden"></div>' +
                            '<div class="{0}"></div>' +
                            '<div class="{1} ui-ribbonButtons  ui-state-default"></div>' +
                            '<div class="{2}"></div>' +
                            '<div class="{3}"></div>';

            return template
                .format(gridFilterClass,
                        gridButtonsClass,
                        gridControlClass,
                        formControlClass);
        };

        jQuery(this.element)
            .addClass('ui-crud ui-widget-content')
            .append(templateGet())
            .find('div.ui-crud-messages:first')
                .each(function () {
                    self.options.crudHeaderDomId = jQuery(this);
                    self.errorInit(jQuery(this));
                });

        this.options.gridFilterDOMId = jQuery(this.element).find('div.{0}:first'.format(gridFilterClass));
        this.options.gridDOMId = jQuery(this.element).find('div.{0}:first'.format(gridControlClass));
        this.options.gridButtonsDOMId = jQuery(this.element).find('div.{0}:first'.format(gridButtonsClass));
        this.options.formDOMId = jQuery(this.element).find('div.{0}:first'.format(formControlClass));
    },
    _init: function () {

        var self = this;

        this._super();
        this._gridButtonsInit();


        var gridOptions = jQuery.extend(
            {},
            {
                gridModel: self.options.gridModel,
                gridViewCellBound: self.options.gridViewCellBound,
                gridPagerInit: self.options.gridPagerInit,

                errorDisplay: function (e, msg) {
                    self.errorDisplay(msg);
                },
                dataBound: function () {
                    if (jQuery(self.options.gridFilterDOMId).is(':visible')) {
                        if (self.options.gridFilterVisibleAlways === false) {
                            self._actionSet(self._actions.list);
                        }
                    }
                },
                paginated: function (e, pagination) {
                    self.options.gridFilterObject.Page = pagination.pageIndex;
                    self.options.gridFilterObject.PageSize = pagination.pageSize;

                    self.errorHide();
                    self._search();
                },
                onSelect: function (e, dataItem) {
                    self.errorHide();
                    self._trigger('onSelect', null, dataItem);
                },
                onEdit: function (e, dataItem) {
                    self.errorHide();
                    self._searchForEdit(dataItem);
                }
            },
            self.options.gridCustomOptions);



        var crudEmptyDataResult = {
            Data: [],
            IsValid: true,
            Message: null,
            Page: 0,
            PageSize: self.options.gridPagerInit().pageSize,
            SortAscending: false,
            SortBy: "",
            TotalRows: 0
        };

        jQuery(this.options.gridDOMId).crudGrid(gridOptions);
        jQuery(this.options.gridDOMId).crudGrid('bind', crudEmptyDataResult);

        this.options.gridFilterInit(self, {
            Model: self.options.filterModel,
            PageSize: self.options.gridPagerInit().pageSize,
            gridFilterVisibleAlways: self.options.gridFilterVisibleAlways,
            filterButtonsInit: self.options.gridFilterButtonsInit,
            errorDisplay: function (e, msg) {
                self.errorDisplay(msg);
            },
            change: function (e, filter) {
                self.options.gridFilterObject = filter;
                self.errorHide();
                self._search();
            },
            cancel: function () {
                self.errorHide();
                self._actionSet(self._actions.list);
            },
            done: function () {

                var crudWidget = self;

                jQuery(crudWidget.options.formDOMId)
                    .crudForm(jQuery.extend({}, {
                        messagedisplayAutoHide: function (e, msg) {
                            self.messagedisplayAutoHide(msg);
                        },
                        messageDisplay: function (e, msg) {
                            self.messageDisplay(msg);
                        },
                        errorDisplay: function (e, msg) {
                            self.errorDisplay(msg);
                        },
                        errorHide: function () {
                            self.errorHide();
                        },
                        change: function (e, formValue) {
                            self.errorHide();
                            self._search();
                        },
                        dataBound: function () {
                            self.errorHide();
                            self._actionSet(self._actions.form);
                        },
                        cancel: function () {
                            self.errorHide();
                            self._actionSet(self._actions.list);
                        },
                    },
                        {
                            formModel: crudWidget.options.formModel,
                            formButtonsGet: crudWidget.options.formButtonsGet,
                            formBind: crudWidget.options.formBind,
                            formValueGet: crudWidget.options.formValueGet,
                            formSaveMethod: crudWidget.options.formSaveMethod
                        }));

                jQuery(crudWidget.options.formDOMId)
                    .find('div.ui-crudForm-modelBinding:first')
                        .widgetModel({
                            modelItems: crudWidget.options.formModel,
                            errorsCleared: function () {
                                crudWidget.errorHide();
                            }
                        })
                    .end();

                self.options.formInit(self, jQuery(crudWidget.options.formDOMId).find('div.ui-crudForm-formContent:first'));

                jQuery(crudWidget.options.formDOMId).fieldItem();

            }
        });


        this._actionSet(this._actions.list);
    },
    destroy: function () {
        this._super();
    },
    _actions: {
        list: 1,
        filter: 2,
        form: 3
    },
    _actionSet: function (actionSelected) {

        var self = this;


        console.log(actionSelected);

        jQuery(self.options.gridFilterDOMId).hide();
        jQuery(self.options.gridButtonsDOMId).hide();
        jQuery(self.options.gridDOMId).hide();
        jQuery(self.options.formDOMId).hide();

        switch (actionSelected) {
            case self._actions.filter:
                jQuery(self.options.gridFilterDOMId).removeClass('ui-helper-hidden').fadeTo('slow', 1);
                break;
            case self._actions.list:

                jQuery(self.options.gridDOMId).removeClass('ui-helper-hidden').fadeTo('slow', 1);

                if (self.options.gridFilterVisibleAlways) {
                    jQuery(self.options.gridFilterDOMId).removeClass('ui-helper-hidden').show();
                    jQuery(self.options.gridButtonsDOMId).hide();
                }
                else {
                    jQuery(self.options.gridFilterDOMId).addClass('ui-helper-hidden');
                    jQuery(self.options.gridButtonsDOMId).show();
                }


                break;
            case self._actions.form:
                jQuery(self.options.formDOMId).removeClass('ui-helper-hidden').fadeTo('slow', 1);
                break;
            default:
                break;
        }
    },
    _search: function () {

        var self = this;

        self._gridSearch()
                .progress(function (status) {
                    self.progressShow(status);
                })
                .fail(function (args) {
                    self.progressHide();
                    self.errorDisplay(args);
                })
                .always(function () {
                    self.progressHide();
                });
    },
    _gridSearch: function () {

        var self = this;
        var dfd = jQuery.Deferred();

        dfd.notify("Buscando...");

        if (self.options.gridSearchMethod === null) {
            dfd.reject(self.namespace + '.' + self.widgetName + "options.gridSearchMethod is an abstract method. Child class must implement");
        }
        else {

            jQuery.when(self.options.gridSearchMethod(self.options.gridFilterObject))
                .then(
                    function (result, statusText, jqXHR) {
                        if (result.IsValid) {
                            jQuery(self.options.gridDOMId).crudGrid('bind', result.Data);
                            dfd.resolve();
                        }
                        else {
                            dfd.reject(result.Message);
                        }
                    },
                    function (jqXHR, textStatus, errorThrown) {
                        dfd.reject("Error buscando");
                    })
                .done(function () {

                });
        }

        return dfd.promise();
    },
    _searchForEdit: function (dataItem) {

        var self = this;

        self._gridEditSearch(dataItem)
                .progress(function (status) {
                    self.progressShow(status);
                })
                .fail(function (args) {
                    self.progressHide();
                    self.errorDisplay(args);
                })
                .always(function () {
                    self.progressHide();
                });
    },
    _gridEditSearch: function (dataItem) {

        var self = this;
        var dfd = jQuery.Deferred();

        dfd.notify("Buscando información...");

        if (self.options.gridSearchForEditMethod === null) {
            dfd.reject(self.namespace + '.' + self.widgetName + ".options.gridSearchForEditMethod is an abstract method. Child class must implement");
        }
        else {

            jQuery.when(self.options.gridSearchForEditMethod(dataItem))
                    .then(
                        function (result, statusText, jqXHR) {
                            if (result.IsValid) {
                                jQuery(self.options.formDOMId).crudForm('bind', result.Data);

                                dfd.resolve();
                            }
                            else {
                                dfd.reject(result.Message);
                            }
                        },
                        function (jqXHR, textStatus, errorThrown) {
                            dfd.reject("Error obteniendo información");
                        })
                    .done(function () {

                    });
        }

        return dfd.promise();


    },
    _gridButtonsInit: function () {

        var defaultButtons = this.options.gridButtonsGet(this, [{
            id: "search",
            text: "Buscar",
            cssClass: "ui-crud-search",
            icon: "ui-icon-search",
            click: function (self) {
                self.errorHide();
                self._actionSet(self._actions.filter);
            }
        }]);

        for (var i = 0; i < defaultButtons.length; i++) {
            this._initButton(this, defaultButtons[i], jQuery(this.options.gridButtonsDOMId));
        }

    },
    //public methods
    gridSearch: function () {

        jQuery(this.element)
            .find('div.ui-crudFilter-buttons')
                .find('button.ui-search-button')
                    .click()
                .end()
            .end();

        return this;
    },
    gridButtonsVisible: function (trueOrFalse) {

        var $dom = jQuery(this.element).find('div.ui-crudCrud-gridButtons');

        if (trueOrFalse) {
            $dom.show();
        }
        else {
            $dom.hide();
        }

        return this;
    },
    gridPagerVisible: function (trueOrFalse) {

        var $dom = jQuery(this.element).find('div.ui-crudGrid-pager');

        if (trueOrFalse) {
            $dom.show();
        }
        else {
            $dom.hide();
        }

        return this;
    }
});

jQuery.widget("ui.crudFilter", jQuery.ui.crudBase,
{
    options: {
        Page: 0,
        PageSize: 10,
        SortBy: "",
        SortAscending: false,
        filterButtonsInit: function (self, defaultButtons) {
            return defaultButtons;
        },
        gridFilterVisibleAlways: false,
    },
    _create: function () {


        this._super();

        jQuery(this.element).widgetModel({
            modelItems: this.options.Model
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
                text: "Volver",
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
            text: "Buscar",
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

            Filter: jQuery(this.element).widgetModel('valAsObject'),
            Page: 0,
            PageSize: this.options.PageSize,
            SortBy: this.options.SortBy,
            SortAscending: this.options.SortAscending
        };

        return model;
    }
});

jQuery.widget("ui.crudGrid", jQuery.ui.crudBase,
{
    options: {
        gridBodyDOMId: null,
        gridPagerDOMId: null,

        gridModel: [],
        gridViewCellBound: function (crudGridWidget, $row, $cell, dataItem, columnName) {
            // use this option to customize row's display items, events, etc

            //throw new Error(crudGridWidget.namespace + '.' + crudGridWidget.widgetName + ".options.gridViewCellBound is an abstract method. Child class method must be implemented");
        },
        gridRowAlternateClass: '',
        gridPagerInit: function () {
            return {};
            //return {
            //    pagerTop: {
            //        paginationShow: false,
            //        totalRowsShow: false,
            //        pageSizeShow: false,
            //    },
            //    pagerBottom: {
            //        paginationShow: true,
            //        totalRowsShow: true,
            //        pageSizeShow: true,
            //    }
            //};
        },
    },
    _create: function () {

        this._super();

        jQuery(this.element)
            .addClass('ui-crudGrid ui-widgetGrid')
            .append(this._gridTemplate());

        this.options.gridBodyDOMId = jQuery(this.element).find('div.ui-crudGrid-body:first');
        this.options.gridPagerDOMId = jQuery(this.element).find('div.ui-crudGrid-pager');

    },
    _init: function () {

        this._super();

        var self = this;

        var pagerOpts = {
            change: function (e, pagination) {
                self._trigger('paginated', null, pagination);
            },
        };

        var pagerConfig = jQuery.extend({},
            {
                pagerTop: {
                    paginationShow: false,
                    totalRowsShow: false,
                    pageSizeShow: false,
                },
                pagerBottom: {
                    paginationShow: true,
                    totalRowsShow: true,
                    pageSizeShow: true,
                }
            },
            this.options.gridPagerInit());


        jQuery(self.options.gridPagerDOMId)
                .first()
                    .gridPagination(jQuery.extend({}, pagerOpts, pagerConfig.pagerTop))
                .end()
                .last()
                    .gridPagination(jQuery.extend({}, pagerOpts, pagerConfig.pagerBottom))
                .end();
    },
    destroy: function () {

        this._super();

    },
    bind: function (data) {
        var self = this;
        self._bindRows(data);
        self._bindPagination(data);
        self._trigger('dataBound', null, data);
    },
    _gridTemplate: function () {

        return '<div class="ui-crudGrid-container">' +
                    '<div class="ui-crudGrid-pager ui-crudGrid-pager-top ui-state-default"></div>' +
                    '<div class="ui-helper-clearfix" ></div>' +

                    '<div class="ui-crudGrid-header ui-widgetGrid-header ui-state-default">' +
                        '<div class="ui-widgetGrid-row" >' +
                            this._gridHeaderTemplate() +
                        '</div>' +
                    '</div>' +
                    '<div class="ui-helper-clearfix" ></div>' +
                    '<div class="ui-crudGrid-body ui-widgetGrid-body ui-helper-clearfix" >' +

                    '</div>' +
                    '<div class="ui-helper-clearfix" ></div>' +
                    '<div class="ui-crudGrid-pager ui-crudGrid-pager-bottom ui-state-default"></div>' +
                    '<div class="ui-helper-clearfix" ></div>' +
                '</div>'
        ;



        //return '<div class="ui-crudGrid-pager ui-crudGrid-pager-top ui-state-default"></div>' +
        //        '<div class="ui-helper-clearfix" ></div>' +
        //        '<div class="ui-crudGrid">' +
        //            '<div class="ui-crudGrid-header ui-widgetGrid-header ui-state-default">' +
        //                '<div class="ui-widgetGrid-row" >' +
        //                    this._gridHeaderTemplate() +
        //                '</div>' +
        //            '</div>' +
        //            '<div class="ui-helper-clearfix" ></div>' +
        //            '<div class="ui-crudGrid-body ui-widgetGrid-body ui-helper-clearfix" >' +

        //            '</div>' +
        //            '<div class="ui-helper-clearfix" ></div>' +
        //        '</div>' +
        //        '<div class="ui-crudGrid-pager ui-crudGrid-pager-bottom ui-state-default"></div>';
    },
    _gridHeaderTemplate: function () {

        var str = '';

        for (var i = 0; i < this.options.gridModel.length; i++) {
            str += '<div class="ui-crudGrid-{0} ui-widgetGrid-column">{1}</div>'.format(this.options.gridModel[i].key, this.options.gridModel[i].displayName);
        }

        return str;
    },
    _gridRowTemplate: function (dataItem) {

        var str = '';

        for (var i = 0; i < this.options.gridModel.length; i++) {
            str += '<div class="ui-crudGrid-{0} ui-widgetGrid-column ui-state-default {2}"><div class="ui-widgetGrid-column-content">{1}</div></div>'
                .format(
                        this.options.gridModel[i].key,
                        dataItem[this.options.gridModel[i].key],
                        (i == (this.options.gridModel.length - 1) ? 'ui-crudGrid-column-last' : ''));
        }

        return str;
    },
    _bindRowAlternatedColor: function () {

        var self = this;

        jQuery(self.options.gridBodyDOMId)
            .children('div')
                .each(function (i, ui) {
                    if (((i % 2) == 1)) {
                        //jQuery(this).addClass('');
                    }
                    else {
                        jQuery(this).addClass(self.options.gridRowAlternateClass);
                    }
                });
    },
    _bindRows: function (data) {

        var self = this;

        jQuery(self.options.gridBodyDOMId).empty();

        if (data.Data.length > 0) {

            for (var i = 0; i < data.Data.length; i++) {
                var dataItem = data.Data[i];
                var $row = jQuery('<div class="ui-crudGrid-dataRow ui-widgetGrid-row ui-state-default {1}">{0}</div>'
                            .format(self._gridRowTemplate(dataItem),
                                    (i == (data.Data.length - 1) ? 'ui-crudGrid-row-last' : '')));

                for (var j = 0; j < this.options.gridModel.length; j++) {

                    var $cell = $row.find('div.ui-crudGrid-{0}:first'.format(this.options.gridModel[j].key))
                                    .find('div.ui-widgetGrid-column-content');


                    self.options.gridViewCellBound(this, $row, $cell, dataItem, this.options.gridModel[j].key);
                }

                jQuery(self.options.gridBodyDOMId).append($row);

                self._bindRowAlternatedColor();
            }
        }
        else {
            var $emtpyRow = '<div class="ui-widgetGrid-emptyRow ui-widgetGrid-column  ui-state-active"><div class="ui-widgetGrid-column-content">{0}</div></div>'
                                .format('No data here');

            jQuery(self.options.gridBodyDOMId).append($emtpyRow);
        }
    },
    _bindPagination: function (data) {

        var self = this;

        jQuery(self.options.gridPagerDOMId).gridPagination('bind', data.Page, data.PageSize, data.TotalRows);
    }
});

jQuery.widget("ui.crudForm", jQuery.ui.crudBase,
{
    options: {
        formButtonsDOMId: null,
        formButtonsGet: function (self, defaultButtons) {
            return defaultButtons;
        },
        formBind: function (self, dataItem) {
            throw new Error(self.namespace + '.' + self.widgetName + ".formBind() is an abstract method. Child class method must be implemented");
        },
    },
    _create: function () {

        this._super();

        jQuery(this.element)
            .addClass('ui-crudForm ui-helper-hidden')
            .append('<div class="ui-crudForm-modelBinding"></div>')
            .children()
                .wrapAll('<div class="ui-crudForm-formContent " />')
            .end()
            .prepend('<div class="ui-crudForm-buttons ui-ribbonButtons  ui-state-default">');

        this.options.formButtonsDOMId = jQuery(this.element).find('div.ui-crudForm-buttons:first');

        this._formButtonsInit();
    },
    _init: function () {

        this._super();

        //this._done();
    },
    _formButtonsInit: function () {

        var self = this;

        var defaultButtons = this.options.formButtonsGet(this, [{
            id: "cancel",
            text: "Cancelar",
            cssClass: "ui-cancel-button",
            icon: "ui-icon-circle-arrow-w",
            click: function (self) {
                self._trigger('cancel', null, null);
            }
        }, {
            id: "save",
            text: "Guardar cambios",
            cssClass: "ui-save-button",
            icon: "ui-icon-disk",
            click: function (self) {
                self._save();
            }
        }]);

        for (var i = 0; i < defaultButtons.length; i++) {
            this._initButton(this, defaultButtons[i], jQuery(this.options.formButtonsDOMId));
        }

        jQuery(this.options.formButtonsDOMId).append('<div class="ui-helper-clearfix"></div>');

    },
    destroy: function () {

        this._super();
    },
    bind: function (dataItem) {
        try {
            jQuery(this.element)
                .data('lastBoundItem', dataItem)
                .find('div.ui-crudForm-modelBinding:first')
                    .widgetModel('bindValue', dataItem.EditData)
                .end();

            this.options.formBind(this, dataItem);
            this._trigger('dataBound', null, dataItem);
        } catch (e) {
            console.error(e);
            this._trigger('errorDisplay', null, "Ha ocurrido un error en el formulario");
        }
    },
    _save: function () {

        var self = this;

        self._formSave(this)
                .progress(function (status) {
                    self.progressShow(status);
                })
                .fail(function (args) {
                    self.progressHide();
                    self._trigger('errorDisplay', null, args);
                })
                .always(function () {
                    self.progressHide();
                });
    },
    _formSave: function () {

        var self = this;
        var dfd = jQuery.Deferred();

        if (self.options.formSaveMethod === null) {
            dfd.reject(self.namespace + '.' + self.widgetName + ".options.formSaveMethod is an abstract method. Child class must implement");
        }
        else {
            dfd.notify("Guardando informacion...");

            var viewModel = self._formValueGet();

            jQuery.when(self.options.formSaveMethod(viewModel))
            .then(
                    function (result, statusText, jqXHR) {
                        if (result.IsValid) {
                            self._trigger('messagedisplayAutoHide', null, result.Message, 50);
                            self._trigger('change', null, result.Data);
                            self.bind(result.Data);
                            dfd.resolve();
                        }
                        else {
                            if (result.Data) {

                                jQuery(self.element)
                                    .find('div.ui-crudForm-modelBinding:first')
                                    .widgetModel('bindErrors', result.Data.ModelState);
                            }
                            dfd.reject(result.Message);
                        }
                    },
                    function (jqXHR, textStatus, errorThrown) {
                        dfd.reject("Error no controlado guadando la información");
                    })
            .done(function () {

            });
        }
        return dfd.promise();
    },
    _formValueGet: function () {
        var dataItem = jQuery(this.element).data('lastBoundItem');
        var formData = jQuery(this.element).find('div.ui-crudForm-modelBinding:first').widgetModel('valAsObject');
        var result = jQuery.extend({}, dataItem, { FormData: formData });
        return this.options.formValueGet(this, result);
    }

});
