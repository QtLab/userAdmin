﻿
var customerOptions = jQuery.extend({}, crudCustomerDefaultFormOptions(), {
    gridFilterVisibleAlways: true,
});

jQuery('div.ui-crudFormSimple:first')
    .find('div.ui-customerCrud:first')
        .crud(customerOptions)
        .hide()
        .removeClass('ui-helper-hidden')
        .fadeIn()
    .end();