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
                    var animationType = getRandomFromArray(animationAPI.classes);
                    var elementsType = getRandomFromArray(elementsSelection);

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

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/cow.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                top: "10px",
                right: "5px",
                height: "81px"
            }));

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/sheep.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                bottom: "10px",
                right: "5px",
                height: "117px"
            }));

            childFrames.push(addIFrame("http://localhost/pluggableUI/src/children/crab.html?lpHost=" + encodeURIComponent("http://" + location.hostname), {
                position: "fixed",
                bottom: "10px",
                left: "5px",
                height: "95px"
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
        document.body.appendChild(ifr);
        return ifr;
    }

})();