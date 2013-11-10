//CONFIG MONGO coonection - AppFog
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
var moment = require('moment'), //momentjs
    db = require('mongoskin').db(mongourl, {
        safe: true
    }), //connection to mongodb
    jQuery = require('jquery'), //jQuery
    $ = jQuery;

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

//recieve recharge card values
exports.rechargeAccount = function(req, res) {
    app.getCredentials(req.query, res);
}

exports.deleteDB = function(req, res) {
    users.remove()
}

var app = {
    server: null,
    paid: 100, //amount paid
    airtime: [
        {human: "30mins", amount: 20, time: 0.5}, //time is hours
        {human: "1hr", amount: 50, time: 1},
        {human: "3hrs", amount: 80, time: 3},
        {human: "6hrs", amount: 120, time: 6},
        {human: "12hrs", amount: 180, time: 12},
        {human: "15hrs", amount: 240, time: 15},
        {human: "24hrs", amount: 300, time: 24}
        // "match": /^\d{4,}\-?(20|80|120|240|300)$/
    ],
    checkUser: function(params, serverResponse) {
        var self = this;
        self.server = serverResponse;

        var userSearch = {
            noPlate: params.noPlate
        };

        //find the user
        users.findOne(userSearch, function(e, res) {
            //console.log(res)
            if (e) throw e; //incase of any errors, stop!
            if (res) { //if found something
                var results = res;
                console.info("We found something, let's update it...");
                //build a response, update the same user's details
                users.update(userSearch, {
                    '$set': { //set these details
                        // timepaid: moment().unix(), //the of seconds since the Unix Epoch
                        // endofservice: moment().add('seconds', (app.paid / 20) * 60 * 60).unix(),
                        lastscanned: moment().format('ddd D, MMM YYYY, hh:mm:ss a'), //eg. "Sun 14, Feb 2010, 3:25:50 pm"
                        scannedBy: params.scannedBy,
                        employeeId: params.scannedById
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
                                overdueTime: Math.abs(results.details.in_minutes), //minutes
                                overdueCost: Math.round(Math.abs(results.details.in_minutes)/60 * 20) //Ksh
                            }
                            self.updateOverdue(updates); //update his overdues
                        }

                        //For reading purposes
                        results.overdueCost = "Ksh " + results.overdueCost;
                        results.overdueTime = results.overdueTime + " minutes";

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
            overdueTime: 0,
            overdueCost: 0,
            scanGeolocation: null, //last location of scanning, where was he parked?
            topupGeolocation: null //last location, he/she topped up.
        }
        //Add the user to the DB
        users.insert(user, function(e, res) {
            if (e) console.error(e);
            if (res) {
                console.info("User data was added.");
                //send back the RESPONSE
                app.checkUser(params, respond); //now recheck user
            }
        })
    },
    //extract user's info
    extractInfo: function() {

    },
    getCredentials: function(p, serverResponse) {
        var self = this;
        self.server = serverResponse;
        //the cred topped up.
        var cred = {
            value: p.credentials, //20|80...
            user: p.noPlate
        }
        //Get the related airtime field
        cred.data = $.grep(self.airtime, function(m, i) {
            return m.amount == cred.value;
        })[0];

        console.log(cred); //return these results for viewing/debugging
        self.rechargeAccount(cred, self.server);
    },
    rechargeAccount: function(cred, serverResponse) {
        var self = this;
        self.server =  serverResponse;
        var userSearch = { //user search object
            noPlate: cred.user
        }
        // console.log(arguments);

        //find the user
        users.findOne(userSearch, function(e, res) {
            console.log(res)
            if (e) throw e;
            if (res) { //if found something
                var r = res;
                console.info("We found something, let's update it...");

                var c = { //computed
                    overdueCost: parseFloat(r.overdueCost) - cred.value,
                    overdueTime: parseFloat(r.overdueTime) - (cred.data.time * 60)
                }

                //correct this values
                var overdueCost = c.overdueCost < 0 ? 0: c.overdueCost;
                var overdueTime = c.overdueTime < 0 ? 0: c.overdueTime;

                //build a response, update the same user's details
                users.update(userSearch, {
                    '$set': { //set these details
                        amountpaid: cred.value,
                        timepaid: moment().unix(), //the of seconds since the Unix Epoch
                        endofservice: moment().add('minutes', cred.data.time * 60).unix(),
                        timeAllocated: moment.duration(cred.data.time * 60, "minutes").humanize(),
                        overdueTime: overdueTime,
                        overdueCost: overdueCost
                        // lastscanned: moment().format('ddd D, MMM YYYY, hh:mm:ss a'), //eg. "Sun 14, Feb 2010, 3:25:50 pm"
                        // scannedBy: cred.scannedBy
                    }
                }, function(e, res) { //results of transaction
                    if (e) console.error(e);
                    else { //respond back
                        self.checkUser(userSearch, serverResponse);
                        console.log(res);
                        console.info("User's data updated successfully.");
                    }
                });
            }else{
                console.log("no one found in DB related to the search param given")
                self.server.json({response: 404, message: "Seems this user is not registered with us"});
            }
        });
    },
    //get or set the overdue cost
    overDue: function(params, respond) {;
        var userSearch = {
            noPlate: params.noPlate
        };
        //Update user field
        users.update(userSearch, {
            '$set': { //set these details
                overdueTime: parseFloat(params.overdueTime), //in minutes
                overdueCost: parseFloat(params.overdueCost) //in Ksh.
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
}