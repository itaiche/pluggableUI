(function () {
    window.childFrames = [];
    window.couriers = [];
    window.channels = new Chronos.Channels({ externalProxy: true });


    bindEvent({
        element: window, eventName: "load", func: function () {

            _buildDOM();

            bindEvent({
                element: "#btnAnimateIt",
                func: function () {
                    var elementsSelection = ["iframe", "img"].concat(templates.keys).concat(randomizer.rotationClasses.slice(1));
                    var animationType = animationAPI.classes[Math.floor(Math.random() * animationAPI.classes.length)];
                    var elementsType = elementsSelection[Math.floor(Math.random() * elementsSelection.length)];
                    if (elementsType !== "iframe" && elementsType !== "img") {
                        elementsType = "." + elementsType;
                    }
                    animationAPI.animate({selector: elementsType, animation: {className: animationType}});
                }
            });
        }
    });

    function _buildDOM() {
        if (window.templates.keys) {
            randomizer.generate();

            new Chronos.PostMessageCourier({
                eventChannel: channels,
                targetOrigin: location.protocol + "//localhost"
            });

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/cow.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                top: 5,
                right: "5px"
            }));

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/sheep.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                bottom: 0,
                right: "5px"
            }));

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/crab.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                bottom: 0,
                left: "5px"
            }));

            while (childFrames.length > 0) {
                couriers.push(new Chronos.PostMessageCourier({
                    eventChannel: channels,
                    target: childFrames.shift(),
                    targetOrigin: location.protocol + "//localhost"
                }));
            }
        } else {
            setTimeout(_buildDOM, 200);
        }
    }

    function addIFrame(URL, style) {
        var ifr = document.createElement("IFRAME");
        ifr.src = URL;
        for (var key in style) {
            if (style.hasOwnProperty(key)) {
                ifr.style[key] = style[key];
            }
        }
        ifr.onload = function () {
            // couriers.push(
            //     new Chronos.PostMessageCourier({
            //         eventChannel: channels,
            //         targetOrigin: location.protocol + "//localhost"
            //     })
            // );
        }.bind(ifr);

        document.body.appendChild(ifr);
        return ifr;
    }

})();