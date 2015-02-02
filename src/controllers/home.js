(function(module) {

    "use strict";

    module.exports.setRoutes = function(app) {


        app.get('/', function(req, res, next) {
            res.sendFile('index.html', {
                root: app.get('views')
            });
            //res.sendFile('../public/index.html', { root: __dirname });
            //res.redirect(301, '/public/index.html');
        });

        app.get('/home', function(req, res, next) {

            console.log("HOOOOOOOOOOOOOOOOOOOLAAAA");

            res.render('home', {
                Title: "Titulo molon",
                DomainName: "localhost:3001"
            });

            /*
            res.sendFile('layout.html', {
                root: app.get('views')
            });
            */

        });

    };

})(module);