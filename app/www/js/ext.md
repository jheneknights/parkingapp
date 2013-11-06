    if (tag.noPlate) { //If tag has the required data -- parking related
        var data = { //create the XHR request param
            scannedBy: app.storeThisSmartly("parkingapp").name,
            noPlate: tag.noPlate,
            phoneNo: tag.phoneNo,
            timeStamp: moment().format(),
            geolocation: "false" //should be added later in the app
        }
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
    }

 ##The required list type
    <li>
        <a href="#">
            <div class="on-right button bck blue text large bold padding white radius">ashdhjdhkhkhhsdjkhhahbahjhdh</div>
            <strong>&lt;strong&gt; element</strong>
            <small>with &lt;small&gt; element</small>
        </a>
    </li>

##List types
    `<article id="list-indented" class="list scroll active">
        <ul>
            <li class="selectable">
                <strong>&lt;li .selectable&gt; + &lt;strong&gt;</strong>
            </li>
            <li>
                <a href="#">
                    <strong>&lt;li&gt; + &lt;a&gt; + &lt;strong&gt;</strong>
                </a>
            </li>
            <li>
                <strong>&lt;li&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
            <li class="anchor contrast">colors</li>
            <li class="dark">
                <strong>&lt;li .dark&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
            <li class="green">
                <strong>&lt;li .theme&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>

            <li class="arrow light">
                <strong>&lt;li .arrow.light&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>

            <li class="anchor contrast">.arrow class</li>

            <li class="arrow">
                <strong>&lt;li .arrow&gt; + &lt;strong&gt;</strong>
            </li>

            <li class="arrow">
                <strong>&lt;li .arrow&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
                <small>&lt;small&gt;</small>
            </li>


            <li class="anchor contrast">.right element</li>

            <li>
                <a href="#">
                    <div class="on-right">.right</div>
                    <strong>&lt;strong&gt; element</strong>
                    <small>with &lt;small&gt; element</small>
                </a>
            </li>

            <li>
                <a href="#">
                    <strong>&lt;strong&gt; element</strong>
                    <small>with &lt;small&gt; element</small>
                    <div class="on-right">.right</div>
                </a>
            </li>

            <li>
                <a href="#">
                    <div class="on-right tag blue">.right.tag</div>
                    <strong>&lt;strong&gt; element</strong>
                    <small>with &lt;small&gt; element</small>
                </a>
            </li>

            <li>
                <a href="#">
                    <div class="on-right" data-icon="globe">.right data-icon</div>
                    <strong>&lt;strong&gt; element</strong>
                    <small>with &lt;small&gt; element</small>
                </a>
            </li>

            <li>
                <a href="#">
                </a>
                <a href="#" class="button small red on-right" data-label="button"></a>
                <strong>&lt;strong&gt; element</strong>
                <small>with &lt;small&gt; element</small>

            </li>

            <li class="anchor contrast">With data-icon or data-image attribute</li>
            <li class="thumb">
                <img src="http://cdn.tapquo.com/lungo/icon-144.png">
                <div>
                    <div class="on-right text tiny">lorem ipsum</div>
                    <strong>&lt;strong&gt;</strong>
                    <span class="text small">
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Neque, aliquam, nisi commodi blanditiis.
                    </span>
                </div>
            </li>

            <li class="thumb big">
                <img src="http://cdn.tapquo.com/lungo/icon-144.png">
                <div>
                    <div class="on-right text tiny">lorem ipsum</div>
                    <strong>&lt;strong&gt;</strong>
                    <span class="text tiny opacity">lorem ipsum</span>
                    <small>
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Neque, aliquam, nisi commodi blanditiis.
                    </small>
                </div>
            </li>

            <li data-icon="user">
                <strong>&lt;li data-icon&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>

            <li class="anchor contrast">With colours</li>
            <li class="accept">
                <strong>&lt;li .accept&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
            <li class="cancel">
                <strong>&lt;li .cancel&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
            <li class="warning">
                <strong>&lt;li .warning&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
            <li class="color">
                <strong>&lt;li .color&gt; + &lt;strong&gt;</strong>
                <small>&lt;small&gt;</small>
            </li>
        </ul>
    </article>`