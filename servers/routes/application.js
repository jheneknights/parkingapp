//CONFIG MONGO coonectio - AppFog
if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var mongo = env['mongodb-1.8'][0]['credentials'];
} else {
    var mongo = {
        "hostname": "localhost",
        "port": 27017,
        "username": "",
        "password": "",
        "name": "",
        "db": "test"
    }
}
var generate_mongo_url = function(obj) {
    obj.hostname = (obj.hostname || 'localhost');
    obj.port = (obj.port || 27017);
    obj.db = (obj.db || 'test');
    if (obj.username && obj.password) {
        return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
    } else {
        return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
    }
}
var mongourl = generate_mongo_url(mongo);
console.log(mongourl);

//Load up required modules
var moment = require('moment'),
    db = require('mongoskin').db(mongourl, {
        safe: true
    }); //connection to mongodb

//the collections/tables to be in use
var users = db.collection('users');
var services = db.collection('services');

/* PARAMS */
//GET /user?scannedBy=Jhene%20Knights&noPlate=kbj0725k&phoneNo=0723001575
/*
var params_GET = {
    status: 200,
    message: "user request PARAMS",
    request: req.query
}
*/

//Get the PARAMS and check if user exist
exports.checkUser = function(req, res) {
    //forward the request to the app functions
    app.checkUser(req.query, res);
}

//update if user has any overdues
exports.updateOverdue = function(req, res) {
    app.overDue(req.query, res);
}

var app = {
    server: null,
    paid: 100, //amount paid
    airtime: {
        "30mins": {amt: 20, time: 0.5},
        "1hr": {amt: 50, time: 1},
        "3hrs": {amt: 80, time: 3},
        "6hrs": {amt: 120, time: 6},
        "12hrs": {amt: 180, time: 12},
        "15hrs": {amt: 240, time: 15},
        "24hrs": {amt: 300, time: 24}
    },
    checkUser: function(params, serverResponse) {
        var self = this;
        self.server = serverResponse;

        var userSearch = {
            noPlate: params.noPlate
        };

        //find the user
        users.findOne(userSearch, function(e, res) {
            //console.log(res)
            if (e) throw e;

            if (res) { //if found something
                var results = res;
                console.info("We found something, let's update it...");
                //build a response, update the same user's details
                users.update(userSearch, {
                    '$set': { //set these details
                        // timepaid: moment().unix(), //the of seconds since the Unix Epoch
                        // endofservice: moment().add('seconds', (app.paid / 20) * 60 * 60).unix(),
                        lastscanned: moment().format('ddd D, MMM YYYY, hh:mm:ss a'), //eg. "Sun 14, Feb 2010, 3:25:50 pm"
                        scannedBy: params.scannedBy
                    }
                }, function(e, res) { //results of transaction
                    if (e) console.error(e);
                    else { //respond back
                        //minor required calculations
                        var paid = moment.unix(results.timepaid),
                            endtime = moment.unix(results.endofservice),
                            now = moment();

                        results.details = {
                            paid: paid.format('ddd D, h:mm a'), //"Sat 19, 12:00 am"
                            ending: endtime.format('ddd D, h:mm a'),
                            offset: endtime.from(now), //in 5 hours
                            in_minutes: endtime.diff(now, "minutes"), //299
                            in_hrs: endtime.diff(now, "hours")
                        }

                        //If the user has any overdues
                        if (results.details.in_minutes < 0) {
                            var updates = {
                                noPlate: results.noPlate, //to be used as ID for REF
                                overdueTime: Math.abs(results.details.in_minutes) + " minutes",
                                overdueCost: "Ksh " + Math.round(Math.abs(results.details.in_minutes)/60 * 20)
                            }
                            self.updateOverdue(updates); //update his overdues
                        }

                        //serve back the response
                        self.server.json(results);

                        console.log(results);
                        console.info("User's data updated successfully.");
                    }
                });
            } else {
                //if nothing was found create that entry for now
                app.createUser(params, self.server);
            }
        });
    },
    //create new user
    createUser: function(params, respond) {
        var user = { //an example of a row in the collection/table
            phoneNo: params.phoneNo,
            noPlate: params.noPlate,
            amountpaid: app.paid, //in KSH: eg. 100
            timepaid: moment().unix(), //the of seconds since the Unix Epoch
            timeAllocated: moment.duration((app.paid / 20) * 60, "minutes").humanize(), //in minutes (20Ksh = 1hr)
            endofservice: moment().add('seconds', (app.paid / 20) * 60 * 60).unix(),
            lastscanned: null,
            scannedBy: null,
            employeeId: null,
            overdueTime: null,
            overdueCost: null
        }
        users.insert(user, function(e, res) {
            if (e) console.error(e);
            if (res) {
                console.info("User data was added.");
                //send back the RESPONSE
                respond.json({
                    status: 200,
                    user: user
                });
            }
        })
    },
    //extract user's info
    extractInfo: function() {

    },
    //get or set the overdue cost
    overDue: function(params, respond) {;
        var userSearch = {
            noPlate: params.noPlate
        };

        users.update(userSearch, {
            '$set': { //set these details
                overdueTime: params.overdueTime,
                overdueCost: params.overdueCost
            }
        }, function(e, res) { //results of transaction
            if (e) console.error(e);
            else { //respond back
                if (respond) {
                    //serve back the response
                    respond.json({
                        status: 200,
                        message: "updated user's overdues successfully"
                    });
                    console.info("User's data updated successfully.");
                }
            }
        });
    },
    updateOverdue: function(params, res) {
        var resp = res ? res: false; //if server response is needed
        this.overDue(params, res);
    },
    topUp: function(params, serverResponse) {
        var self = this;
        self.server = serverResponse;

        var userSearch = {
            noPlate: params.noPlate
        };

        //find the user
        users.findOne(userSearch, function(e, res) {
            //console.log(res)
            if (e) throw e;

            if (res) { //if found something
                var results = res;
                console.info("We found something, let's update it...");
                //build a response, update the same user's details
                users.update(userSearch, {
                    '$set': { //set these details
                        // timepaid: moment().unix(), //the of seconds since the Unix Epoch
                        // endofservice: moment().add('seconds', (app.paid / 20) * 60 * 60).unix(),
                        lastscanned: moment().format('ddd D, MMM YYYY, hh:mm:ss a'), //eg. "Sun 14, Feb 2010, 3:25:50 pm"
                        scannedBy: params.scannedBy
                    }
                }, function(e, res) { //results of transaction
                    if (e) console.error(e);
                    else { //respond back
                        //minor required calculations
                        var paid = moment.unix(results.timepaid),
                            endtime = moment.unix(results.endofservice),
                            now = moment();

                        results.details = {
                            paid: paid.format('ddd D, h:mm a'), //"Sat 19, 12:00 am"
                            ending: endtime.format('ddd D, h:mm a'),
                            offset: endtime.from(now), //in 5 hours
                            in_minutes: endtime.diff(now, "minutes"), //299
                            in_hrs: endtime.diff(now, "hours")
                        }

                        //If the user has any overdues
                        if (results.details.in_minutes < 0) {
                            var updates = {
                                noPlate: results.noPlate, //to be used as ID for REF
                                overdueTime: Math.abs(results.details.in_minutes) + " minutes",
                                overdueCost: "Ksh " + Math.round(Math.abs(results.details.in_minutes)/60 * 20)
                            }
                            self.updateOverdue(updates); //update his overdues
                        }

                        //serve back the response
                        self.server.json(results);

                        console.log(results);
                        console.info("User's data updated successfully.");
                    }
                });
            } else {
                //if nothing was found create that entry for now
                app.createUser(params, self.server);
            }
        });
    }
}