(function() {
    bindEvent({
        element: window, eventName: "load", func: function(){

            _buildDOM();

            bindEvent({
                element: "#btnAnimateIt",
                func: function () {
                    var animationType = animationAPI.classes[Math.floor(Math.random() * animationAPI.classes.length)];
                    var elementsType = templates.keys[Math.floor(Math.random() * templates.keys.length)];
                    animationAPI.animate({selector: "." + elementsType, animation: {className: animationType}});
                }
            });
        }

    });

    function _buildDOM(){
        if (window.templates.keys) {
            randomizer.generate();
            addIFrame("children/cow.html", {
                position : "fixed",
                top: 0,
                right: "5px"
            });

            addIFrame("children/sheep.html", {
                position : "fixed",
                bottom: 0,
                right: "5px"
            });

            addIFrame("children/crab.html", {
                position : "fixed",
                bottom: 0,
                left: "5px"
            });

        } else {
            setTimeout(_buildDOM, 200);
        }
    }

    function addIFrame(URL, style){
        var ifr = document.createElement("IFRAME");
        ifr.src = URL;
        for(var key in style){
            if(style.hasOwnProperty(key)){
                ifr.style[key] = style[key];
            }
        }
        document.body.appendChild(ifr);
    }

})();