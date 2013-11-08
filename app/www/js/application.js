/**
 *
 *@Author - Eugene Mutai
 *@Twitter - JheneKnights
 *
 * Date: 9/8/13
 * Time: 1:48 PM
 * Description:
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/gpl-2.0.php
 *
 * Copyright (C) 2013
 * @Version -
 */

//---------- KNOCKOUT VIEW MODEL RULES ---------->
var vM = {
    name: ko.observable('').extend({
        required: true,
        pattern: {
            params: /^[\w-]{2,}\s[\w-]{2,}$/, //jhene knights
            message: "please enter you two names."
        }
    }),
    registration: ko.observable('').extend({
        required: true,
        minLength: 6,
        pattern: {
            params: /^(\+)?[\d-]{6,}/, //+254723001575
            message: "invalid registration number"
        }
    }),
    noplate: ko.observable('').extend({
        required: true,
        minLength: 6,
        pattern: {
            params: /^(\w{3})(\s)?(\d{3})(\w{1})?$/,
            message: "please enter a valid plate no"
        }
    }),
    //credit card data
    credentials: ko.observable('').extend({
        required: true,
        minLength: 6,
        pattern: {
            params: /^\d{4,}\-?(20|80|120|240|300)$/, //1234(20|80...) eg.1234240, 1234-20
            message: "please enter a valid top up PIN"
        }
    }),
    appInit: ko.observable(false), //has the app initialised
    xhrError: ko.observable(null), //if app has any errors
    serverResponse: ko.observableArray([
        /* {
            phoneNo: '0723001575',
            noPlate: 'KBJ075K'
        } */
    ]),
    topupResponse: ko.observableArray([]), //empty to start with
    //scan status of the app
    xhrStatus: ko.observable(null),
    searchUser: function(ko, event) {
        if (this.noplate().length !== 0) {
            var data = { //create the XHR request param
                scannedBy: app.storeThisSmartly("parkingapp").name,
                scannedById: app.storeThisSmartly('parkingapp').registaration,
                noPlate: this.noplate(),
                // phoneNo: tag.phoneNo,
                timeStamp: moment().format(),
                geolocation: false //should be added later in the app
            }
            console.log(data);
            vM.xhrError(null);
            vM.xhrStatus('Searching...please wait.');
            vM.serverResponse.removeAll(); //empty the field
            var jqhxr = jQuery.get(app.URL.server + '/scan', data, function(json) { //response from server
                // navigator.notification.alert(JSON.stringify(json), app.doNothing, "Response from server");
                if(json.response) vM.xhrError(json.message); else vM.serverResponse.push(json);
            }, "json").fail(function(xhr, text, error) {
                vM.xhrError("For some reason, failed to connect with the servers. Error: " + error) //, app.doNothing, "XHR error");
            }).done(function(json) {
                console.log("successfully fetch related data from the servers");
            }).always(function() {
                vM.xhrStatus(null)
            });
            // navigator.notification.vibrate(100);
        } else {
            console.error("Failed validation - search")
        }
    },
    topUp: function(ko, event) {
        var pattern = /^\d{4,}\-?(20|80|120|240|300)$/;
        if (this.topupValidation()) {
            console.log("good to go.")
            var data = {
                noPlate: this.noplate(),
                credentials: pattern.exec(this.credentials())[1], //20|120|240...
                timeStamp: moment().format(),
                geolocation: false
            }
            console.log(data);
            vM.xhrError(null);
            vM.xhrStatus('Please wait...')
            vM.topupResponse.removeAll();
            //communicate with server now
            var jqhxr = jQuery.get(app.URL.server + '/recharge', data, function(json) { //response from server
                // navigator.notification.alert(JSON.stringify(json), app.doNothing, "Response from server");
                if(json.response) vM.xhrError(json.message); else vM.topupResponse.push(json);
            }, "json").fail(function(xhr, text, error) {
                vM.xhrError("For some reason, failed to connect with the servers. Error: " + error) //, app.doNothing, "XHR error");
            }).done(function(json) {
                console.log("successfully fetch related data from the servers");
            }).always(function() {
                vM.xhrStatus(null)
            });
        } else {
            console.error("failed validation - topUp")
        }
    }
}

vM.topupValidation = ko.computed(function() {
    //validate only these
    var validation = ko.validatedObservable({
        name: vM.noplate,
        credentials: vM.credentials
    });
    var isValid = validation.isValid();
    return isValid;
}, vM);

vM.allisvalid = ko.computed(function() {
    //validate only these
    var validation = ko.validatedObservable({
        name: vM.name,
        registration: vM.registration
    });
    var isValid = validation.isValid();
    return isValid;
}, vM);

//------------- APP FUNCTIONS -------------->
var app = {
    status: false, //if NFC is running,
    URL: {
        server: 'http://jkpkapp.aws.af.cm',
        local: 'http://localhost:3000'
    },
    doNothing: function() {}, //empty function
    initialize: function() {
        this.bind();
        console.log("initialising app...");
    },
    bind: function() {
        //start cordova and the native app functions
        document.addEventListener('deviceready', this.deviceready, false);
    },
    deviceready: function() {
        //App has initialised
        if (this.checkUser()) //1st
        {
            console.log("there is a valid user");
            vM.appInit(true); //pass true, app has innitialsied
        }
    },
    //Authenticating the USER that will use the NFC scanner
    checkUser: function() {
        if (app.storeThisSmartly("parkingapp")) { //if the user exists
            $('section#sign-up-page').animate({
                margin: "-150%"
            });
            return true;
        } else {
            //do nothing.
            $('section#sign-up-page').animate({
                margin: 0
            });
            //event to register user
            $('#register-user').click(function(event) {
                event.preventDefault();
                if (vM.allisvalid()) {
                    user = ko.toJS(vM);
                    app.registerUser(user, app.checkUser);
                    console.log(JSON.stringify(user));
                } else {
                    $('#sign-up-page').find("input").attr('required', true);
                    console.error("There are errors with the form field")
                }
            });
            return false;
        }
    },
    registerUser: function(user, callback) {
        this.storeThisSmartly("parkingapp", {
            local: true,
            content: {
                name: user.name,
                registaration: user.registration
            }
        })
        if (callback)
            if (typeof callback == "function") callback();
        return true;
    },
    /**
     * @param options - local(bool), content(object), backup(bool)
     * @param key
     * STORE CONTENT locally or in cookie or BOTH
     */
    storeThisSmartly: function(key, options) {
        if (options) { //store this data
            if (options.local) {
                localStorage.setItem(key, JSON.stringify(options.content));
            } else { //also in cookie too
                $.cookie(key, options.content);
                if (options.backup) localStorage.setItem(key, JSON.stringify(options.content));
            }
        } else if (options == false) { //if options == false
            localStorage.removeItem(key);
            if ($.cookie) $.cookie(key, false); //remove everything
        }

        //if only one argument is given retrieve that data from localstorage
        return arguments.length == 1 ? JSON.parse(localStorage.getItem(key)) : false;
    },
    //http://maps.google.com/maps/api/geocode/json?latlng=-1.2922417,36.8991335&sensor=true
    geoLocateUser: function() {
        var location = '', coords = {};
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                    //console.log(position)
                    $.get("http://app.prittynote.com/app/geolocate.php",
                        {latlng: position.coords.latitude + ',' + position.coords.longitude, sensor: "true"},
                        function(m) {
                            if(m.results.length > 0) {
                                if(m.results.length > 1) location = m.results[1].formatted_address;
                                else location = m.results[0].formatted_address;
                            }

                            coords = {
                                lat: position.coords.latitude,
                                long: position.coords.longitude,
                                location: location
                            }

                            if(localStorage) {
                                app.storeThisSmartly("userLocationData", {
                                    content: coords
                                })
                            }else{
                                $.cookie('userLocationData', JSON.stringify(coords))
                            }
                            console.log("User's location: " + location)
                        }, "json")
                },
                function(e) {
                    switch(e.code) {
                        case e.PERMISSION_DENIED:
                            //if permission was denied
                            break
                        case e.POSITION_UNAVAILABLE:
                            //if javascript failed to acquire the coordinates
                            break
                        case e.TIMEOUT:
                            //if the request timed out, do the request again
                            app.geoLocateUser();
                            break
                    }
                    //alert("Error Occured: " + e.message)
                },
                {enableHighAccuracy: true, timeout: 30000, maximumAge: 2000*60*60}
            )
            //timeout after 30 secs, and get pos which is not older than 2 hrs
        }
        //return statusShare.data
    }
}