(function () {

    let shapeCount = 200;
    let rotateClasses = ["", "rotate7", "rotate15", "rotate30", "rotate50","rotate70", "rotate100", "rotate125","rotate147", "rotate159", "rotate175"];
    let viewPort = {
        height: Window.innerHeight,
        width: window.innerWidth
    };
    let deviceScreen = {
        height: window.screen.height  !== window.screen.availHeight ?  window.screen.availHeight : window.screen.availHeight,
        width: window.innerWidth
    };

    function createElements(count) {
        for (var i = 0; i < (count || shapeCount); i++) {
            let type = getRandomFromArray(templates.keys);
            let left = Math.floor((viewPort.width || deviceScreen.width) * Math.random());
            left = left < 0 ? 0 : left;
            let top = Math.floor((viewPort.height || deviceScreen.height) * Math.random());

            document.body.appendChild(templates.generate(type, {
                wrapper: "span",
                styles: {
                    position: "absolute",
                    top: top + "px",
                    left: left + "px"
                },
                className: getRandomFromArray(rotateClasses)
            }));
        }
    }
    window.randomizer = {
       generate : createElements,
       rotationClasses: rotateClasses
    };
})();
