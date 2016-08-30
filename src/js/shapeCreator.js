(function () {

    let shapeCount = 200;
    let viewPort = {
        height: Window.innerHeight,
        width: window.innerWidth
    };
    let deviceScreen = {
        height: window.screen.height  !== window.screen.availHeight ?  window.screen.availHeight : window.screen.availHeight ,
        width: window.screen.width
    };

    function createElements(count) {
        for (var i = 0; i < (count || shapeCount); i++) {
            let type = templates.keys[Math.floor(Math.random() * templates.keys.length)];
            document.body.appendChild(templates.generate(type, {
                wrapper: "span",
                styles: {
                    position: "absolute",
                    top: Math.floor((viewPort.height || deviceScreen.height) * Math.random()) + "px",
                    left: Math.floor((viewPort.width || deviceScreen.width) * Math.random()) + "px"
                }
            }));
        }
    }
    window.randomizer = {
       generate : createElements
    };
})();
