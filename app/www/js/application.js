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

//---------- KNOCKOUT RULES ---------->
var appmodel = {
    name: ko.observable('').extend({
        required: true,
        pattern: {
            params: /^([\w-]{2,})\s([\w-]{2,})$/, //jhene-knights
            message: "please enter you two names."
        }
    }),
    registration: ko.observable('').extend({
        required: true,
        minLength: 6,
        pattern: {
            params: /^(\+)?[\d.-]{5,}/, //+254723001575
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
    appInit: ko.observable(false), //has the app initialised
    ndefData: ko.observableArray([
        /* {
            phoneNo: '0723001575',
            noPlate: 'KBJ075K'
        } */
    ]),
    //scan status of the app
    scanStatus: ko.observable(''),
    searchUser: function(ko, event) {
        if (this.noplate().length !== 0) {
            var data = { //create the XHR request param
                scannedBy: app.storeThisSmartly("parkingapp").name,
                noPlate: this.noplate(),
                // phoneNo: tag.phoneNo,
                timeStamp: moment().format(),
                geolocation: "false" //should be added later in the app
            }
            var jqhxr = jQuery.get('http://jkpkapp.aws.af.cm/scan', data, function(json) { //response from server
                // navigator.notification.alert(JSON.stringify(json), app.doNothing, "Response from server");
                appmodel.ndefData.push(json);
            }, "json").fail(function(xhr, text, error) {
                appmodel.scanStatus("For some reason, failed to connect with the servers. <br/><span class='red-bg white small-padding'>Error: " + error + '</span>') //, app.doNothing, "XHR error");
            }).done(function(json) {
                appmodel.scanStatus("Successfully server request.")
                console.log("successfully fetch related data from the servers");
            });
            // navigator.notification.vibrate(100);
        }
    }
}

appmodel.allisvalid = ko.computed(function() {
    //validate only these
    var validation = ko.validatedObservable({
        name: appmodel.name,
        registration: appmodel.registration
    });
    var isValid = validation.isValid();
    return isValid;
}, appmodel);

//------------- APP FUNCTIONS -------------->
var app = {
    status: false, //if NFC is running,
    doNothing: function() {}, //empty function
    initialize: function() {
        app.bind();
        console.log("initialising app...");
    },
    bind: function() {
        //start cordova and the native app functions
        document.addEventListener('deviceready', app.deviceready, false);
    },
    deviceready: function() {
        //App has initialised
        if (app.checkUser()) //1st
        {
            console.log("there is a valid user")
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
                if (appmodel.allisvalid()) {
                    user = ko.toJS(appmodel);
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
        app.storeThisSmartly("parkingapp", {
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
    }
}