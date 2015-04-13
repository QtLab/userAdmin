jQuery(document).ready(function () {

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

        $gridControl.height(jQuery(window).height() - convertEmToPixels(9.7));
    };

    jQuery(window)
        .resize(function (e, ui) {
            gridControlResize();
        });

    gridControlResize();

});