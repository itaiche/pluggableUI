(function () {
  window.childFrames = [];
  window.couriers = [];
  window.channels = new Chronos.Channels({externalProxy: true});
  window.state = {
    insane: false
  };

  bindEvent({
    element: window, eventName: "load", func: function () {

      _buildDOM();

      bindEvent({
        element: "#btnAnimateIt",
        func: function () {
          animate();
        }
      });

      bindEvent({
        element: "#insane",
        func: () => {
          window.state.insane = !window.state.insane;
          animateConstantly();
        }
      });
    }
  });

  function animate() {
    const elementsSelection = ["iframe", "img"].concat(templates.keys).concat(randomizer.rotationClasses.slice(1));
    const animationType = getRandomFromArray(animationAPI.classes);
    let elementsType = getRandomFromArray(elementsSelection);

    if (elementsType !== "iframe" && elementsType !== "img") {
      elementsType = "." + elementsType;
    }
    animationAPI.animate({selector: elementsType, animation: {className: animationType}});
  }

  function animateConstantly() {
    if (window.state.insane) {
      animate();
      setTimeout(animateConstantly, 200);
    }
  }

  function _buildDOM() {
    if (window.templates.keys) {
      randomizer.generate();
      const lpHost = encodeURIComponent(`${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}`);
      childFrames.push(addIFrame(`children/cow.html?lpHost=${lpHost}`,
        {
          position: "fixed",
          top: "10px",
          right: "5px",
          height: "81px"
        }));

      childFrames.push(addIFrame(`children/sheep.html?lpHost=${lpHost}`,
        {
          position: "fixed",
          bottom: "10px",
          right: "5px",
          height: "117px"
        }));

      childFrames.push(addIFrame(`children/crab.html?lpHost=${lpHost}`,
        {
          position: "fixed",
          bottom: "10px",
          left: "5px",
          height: "95px"
        }));

      while (childFrames.length > 0) {
        couriers.push(new Chronos.PostMessageCourier({
          eventChannel: channels,
          target: childFrames.shift(),
          targetOrigin: `${location.protocol}//${location.hostname}${location.port ? ':' + location.port : ''}`
        }));
      }
    } else {
      setTimeout(_buildDOM, 200);
    }
  }

  function addIFrame(URL, style) {
    const ifr = document.createElement("IFRAME");
    ifr.src = URL;
    for (let key in style) {
      if (style.hasOwnProperty(key)) {
        ifr.style[key] = style[key];
      }
    }
    document.body.appendChild(ifr);
    return ifr;
  }

})();