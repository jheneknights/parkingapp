/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/application'); // ./routes/application.js

var http = require('http');
var path = require('path');

var app = express();

//for AF
var port = process.env.VMC_APP_PORT || 3000;
var host = process.env.VCAP_APP_HOST || 'localhost';


//http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs#answer-7069902
//enable cross-origin resource -- CORS
// var allowCrossDomains = function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//     res.header('Access-Control-Allow-Headers', 'Content-Type');
//     next();
// }

// all environments
app.set('port', process.env.PORT || port);
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
// app.use(allowCrossDomains); //for CORS
app.use(express.methodOverride());
app.use(express.cookieParser('jheneknights'));
app.use(express.session());
app.use(app.router);
// app.use(express.static(path.join(__dirname, 'public')));

//The path to the application (android)
// we are specifying the html directory as another public directory
app.use(express.static(path.join(__dirname, 'application')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

//For simple CORS requests, the server only needs to add the following header to its response
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
});

//Index root request
app.get('/', function(req, res) {
    res.json({
        status: 200,
        message: "Server up and running smoothly."
    })
});

//default app route
app.get('/application', function(req, res) {
    res.sendfile('./application/test.html')
});

//Scan instance
app.get('/scan', routes.checkUser);

app.get('/overdue', routes.updateOverdue)

//Register User
app.post('/register', routes.checkUser);

//Topping up
app.post('/scratchcard', function() {
    //do something
})

//start up the servers
http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});