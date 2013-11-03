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
        //"Listening for non-NDEF tags."
        nfc.addNdefListener(app.onNdef, function() {
            app.onNfcSuccess("NDEF");
            appmodel.appInit(true); //activate the app now, show that it is active
            app.checkUser(); //check to see user
        }, app.onFail)

        //If android
        if (device.platform == "Android") {
            // Android reads non-NDEF tag. BlackBerry and Windows don't.
            nfc.addTagDiscoveredListener(app.onNdef, function() {
                app.onNfcSuccess("non-NDEF")
            }, app.onFail);

            // Android launches the app when tags with mime type text/pg are scanned
            // because of an intent in AndroidManifest.xml.
            // phonegap-nfc fires an ndef-mime event (as opposed to an ndef event)
            // the code reuses the same onNdef handler
            nfc.addMimeTypeListener('text/pg', app.onNdef, function() {
                app.onNfcSuccess("NDEF-mime")
            }, app.onFail);
        }
        console.log("App has successfully initialised.");
    },
    //if NFC tag is read
    onNdef: function(nfcEvent) {
        var tag = nfcEvent.tag;

        //empty the scanned content
        appmodel.ndefData.removeAll();
        appmodel.scanStatus("Tag discovered, extracting content...");

        // BB7 has different names, copy to Android names
        if (tag.serialNumber) {
            tag.id = tag.serialNumber;
            tag.isWritable = !tag.isLocked;
            tag.canMakeReadOnly = tag.isLockable;
        }
        //alert(JSON.stringify(tag));

        //if Tag has data
        if (tag.ndefMessage) {
            //Decode the ndefMessage
            var ndefdecoded = ndef.textHelper.decodePayload(tag.ndefMessage[0].payload); //convert to object
            // var ndefdecoded = tag.ndefMessage[0];

            tag = JSON.parse(ndefdecoded);
            if (tag.noPlate) { //If tag has the required data -- parking related
                var data = { //create the XHR request param
                    scannedBy: app.storeThisSmartly("parkingapp").name,
                    noPlate: tag.noPlate,
                    phoneNo: tag.phoneNo,
                    timeStamp: moment().format(),
                    geolocation: "false" //should be added later in the app
                }
                //pass the data as model to its correct template
                //appmodel.ndefData([data]);

                // navigator.notification.alert("Data to be sent: \n\n" + JSON.stringify(data), function() {
                //     //Send this data to the Server's and await response
                //     jQuery.get('http://jkpkapp.aws.af.cm/scan', data, function(json) { //response from server
                //         navigator.notification.alert(JSON.stringify(json), app.doNothing, "Response from server");
                //     }, "json");
                // }, "Sending to servers");

                //Send this data to the Server's and await response
                var jqhxr = jQuery.get('http://jkpkapp.aws.af.cm/scan', data, function(json) { //response from server
                    // navigator.notification.alert(JSON.stringify(json), app.doNothing, "Response from server");
                    appmodel.ndefData.push(json);
                }, "json").fail(function(xhr, text, error) {
                    appmodel.scanStatus("For some reason, failed to connect with the servers. <br/><span class='red-bg white small-padding'>Error: " + error + '</span>') //, app.doNothing, "XHR error");
                }).done(function(json) {
                    appmodel.scanStatus("Successfully extracted.")
                    console.log("successfully fetch related data from the servers");
                });
                navigator.notification.vibrate(100);
            }else{
                appmodel.scanStatus("Ohw! This TAG is not what we are looking for.");
            }
        } else {
            appmodel.scanStatus("this TAG is empty!");
            // app.nfcWrite(); //the tag must be empty please write to it

            function onConfirm (index) {
                if(index == 1) app.nfcWrite(); //if "write" is pressed.
            }
            navigator.notification.confirm("this TAG is empty, should we write data to it?", onConfirm, "New Tag!", "Write,Leave");
            console.log("no TAG DATA was found. Writing new data into it...");
        }

        //Confirm the tag was read
        // navigator.notification.alert("Results from scanning --> \n\n" + JSON.stringify(tag), app.doNothing, "Read Success");
        navigator.notification.vibrate(100);
    },
    //IF NFC listening begins
    onNfcSuccess: function(nfcType) {
        app.status = true;
        console.log("Listening for " + nfcType + " mime tags, also with type text/pg mime type.");
    },
    //if the NFC app did not start successfully.
    onFail: function(reason) {
        app.status = false;
        navigator.notification.alert("Oh my! Something went really wrong dumnbass!", app.doNothing, reason);
        setTimeout(app.initialize, 5000); //try again after 5 seconds
    },
    //Write to the NFC TAG that was read.
    nfcWrite: function() {
        var data = {
            "phoneNo": "0723001575",
            "noPlate": "KBJ075K"
        }

        //create ndefMessage and write to the TAG
        // var ndefMessage = ndef.mimeMediaRecord('text/pg', nfc.stringToBytes(JSON.stringify(data)));
        var ndefMessage = ndef.textRecord(JSON.stringify(data));
        nfc.write([ndefMessage], function() { //success
                navigator.notification.alert("successfully written to the NDEF TAG", app.doNothing, "Write Success");
            },
            function(reason) { //if an error occured
                navigator.notification.alert("Something when wrong while trying to write to the TAG.", app.doNothing, "Write Error");
            }
        );
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