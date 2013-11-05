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
            params: /[\w.-]{6,}/, //jhene-knights
            message: "please enter a valid name."
        }
    }),
    registration: ko.observable('').extend({
        required: true,
        minLength: 6,
        pattern: {
            params: /^(\+)?[0-9.-]{5,}/, //+254723001575
            message: "invalid registration number"
        }
    }),
    //hide the sign up form
    signupForm: ko.observable(false),
    appInit: ko.observable(false), //has the app initialised
    ndefData: ko.observableArray([
        /* {
            phoneNo: '0723001575',
            noPlate: 'KBJ075K'
        } */
    ]),
    //scan status of the app
    scanStatus: ko.observable("Scan a card to begin!")
}

appmodel.appStatus = ko.computed(function() { //status of the app (on/off -- green/red)
    var stat = appmodel.appInit() ? {
        css: 'button-positive',
        text: "active"
    } : {
        css: 'button-negative',
        text: "inactive"
    };
    return stat;
}, appmodel);

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
    },
    //Authenticating the USER that will use the NFC scanner
    checkUser: function() {
        if (app.storeThisSmartly("parkingapp")) { //if the user exists
            $('#signupmodal').slideUp(500);
        } else {
            //do nothing.
            appmodel.signupForm(true); //show the sign-up form
            $('#signupmodal').slideDown(500);

            //align the signup form
            $('form.registration-form').css('padding-top', function() {
                return ($(window).height() - $(this).height()) / 6
            })

            //event to register user
            $('.register-user').click(function(event) {
                event.preventDefault();
                if (appmodel.allisvalid()) {
                    user = ko.toJS(appmodel);
                    app.registerUser(user, app.doNothing);
                    console.log(JSON.stringify(user));
                } else {
                    $('.input-group').children("input").css('border', '1px solid red');
                    console.error("There are errors with the form field")
                }
            });
        }
    },
    registerUser: function(user, callback) {
        app.storeThisSmartly("parkingapp", {
            local: true,
            content: {
                name: user.name,
                registaration: user.registaration
            }
        })
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