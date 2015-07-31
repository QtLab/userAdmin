﻿define([
    "jquery",
    "jqueryui",
    "scripts/Template.App.ClientApp",
    "scripts/crud/common.widget.crud.base"
],
    function ($, jqUI, clientApp) {

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

                texts: {
                    gridEmptyData: clientApp.i18n.texts.get("Template.Widget.Crud.EmptyResults"),
                    gridBindingError: clientApp.i18n.texts.get("Template.Widget.Crud.UnhandledErrorBindingGridData")
                }
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
                        infiniteScrolling: false,
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


                if (pagerConfig.infiniteScrolling === true)
                {
                    pagerConfig.pagerTop.infiniteScrolling = true;
                    pagerConfig.pagerBottom.infiniteScrolling = true;
                }

                pagerConfig = jQuery.extend({}, pagerOpts, pagerConfig);

                jQuery(self.options.gridPagerDOMId)
                        .first()
                            .gridPagination(jQuery.extend({}, pagerConfig, pagerConfig.pagerTop))
                        .end()
                        .last()
                            .gridPagination(jQuery.extend({}, pagerConfig, pagerConfig.pagerBottom))
                        .end();

            },
            destroy: function () {

                this._super();

            },
            emptyData: function () {
                jQuery(this.options.gridBodyDOMId).empty();
                this._buildEmptyDataRow();
            },
            bind: function (data) {
                try {
                    this._bindRows(data);
                    this._bindPagination(data);
                    this._trigger('dataBound', null, data);
                } catch (e) {

                    console.error(e);
                    this._trigger('errorDisplay', null, this.options.texts.gridBindingError);
                }

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

                var pagerOptions = this.options.gridPagerInit();

                if (data.data.length > 0) {

                    if (pagerOptions.infiniteScrolling !== true) {
                        jQuery(self.options.gridBodyDOMId).empty();
                    }
                    else {
                        jQuery(self.options.gridBodyDOMId).find('div.ui-widgetGrid-emptyRow:first').remove();
                    }

                    for (var i = 0; i < data.data.length; i++) {
                        var dataItem = data.data[i];
                        var $row = jQuery('<div class="ui-crudGrid-dataRow ui-widgetGrid-row ui-state-default {1}">{0}</div>'
                                    .format(self._gridRowTemplate(dataItem),
                                            (i == (data.data.length - 1) ? 'ui-crudGrid-row-last' : '')));

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

                    if (pagerOptions.infiniteScrolling !== true) {
                        self._buildEmptyDataRow();
                    }
                    else {
                        // Pager unbind scroll event automatically when no data is present based on Page*PageSize>TotalRows
                    }
                }
            },
            _bindPagination: function (data) {
                jQuery(this.options.gridPagerDOMId).gridPagination('bind', data.page, data.pageSize, data.totalRows);
            },
            _buildEmptyDataRow: function () {
                var $emtpyRow = '<div class="ui-widgetGrid-emptyRow ui-widgetGrid-column  ui-state-active"><div class="ui-widgetGrid-column-content">{0}</div></div>'
                                    .format(this.options.texts.gridEmptyData);

                jQuery(this.options.gridBodyDOMId).append($emtpyRow);
            }
        });

    });