(function () {
  let animateClass = " animated",
    animateInfiniteClass = " infinite",
    animationClasses = ["animated", "infinite", "bounce", "flash", "pulse", "rubberBand", "shake", "headShake", "swing", "tada", "wobble", "jello", "bounceIn", "bounceInDown", "bounceInLeft", "bounceInRight", "bounceInUp", "bounceOut", "bounceOutDown", "bounceOutLeft", "bounceOutRight", "bounceOutUp", "fadeIn", "fadeInDown", "fadeInDownBig", "fadeInLeft", "fadeInLeftBig", "fadeInRight", "fadeInRightBig", "fadeInUp", "fadeInUpBig", "fadeOut", "fadeOutDown", "fadeOutDownBig", "fadeOutLeft", "fadeOutLeftBig", "fadeOutRight", "fadeOutRightBig", "fadeOutUp", "fadeOutUpBig", "flipInX", "flipInY", "flipOutX", "flipOutY", "lightSpeedIn", "lightSpeedOut", "rotateIn", "rotateInDownLeft", "rotateInDownRight", "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight", "hinge", "rollIn", "rollOut", "zoomIn", "zoomInDown", "zoomInLeft", "zoomInRight", "zoomInUp", "zoomOut", "zoomOutDown", "zoomOutLeft", "zoomOutRight", "zoomOutUp", "slideInDown", "slideInLeft", "slideInRight", "slideInUp", "slideOutDown", "slideOutLeft", "slideOutRight", "slideOutUp"];

  function animateElement(options = {selector: "div", animation: {className: animationClasses[2], infinite: false}}) {
    let animationsCompleted = 0,
      eventTriggered = false,
      elements = document.querySelectorAll(options.selector);

    let length = elements.length;

    elements.forEach(function (element) {
      let classes = element.className.split(" ");
      let resClass = "";
      classes.forEach(function (elemClass) {
        if (animationClasses.indexOf(elemClass) < 0) {
          resClass += elemClass + " ";
        }
      });
      bindEvent({
        element: element,
        eventName: "animationend",
        func: clearAnimationClass.bind(element, resClass, length)
      });
      resClass += options.animation.className + animateClass + (options.animation.infinite ? animateInfiniteClass : '');
      element.className = resClass;
    });

    function clearAnimationClass(originalClass, totalElements) {
      this.className = originalClass;
      animationsCompleted++;
      if (!eventTriggered && animationsCompleted >= totalElements) {
        let eventData = {
          elementCount: totalElements,
          animated: options.animation.className
        };
        let additionalKey = getRandomFromArray(["cow", "sheep", "crab"]);
        eventData[additionalKey] = true;

        window.channels.trigger({
          eventName: "animationComplete",
          appName: "animator",
          data: eventData
        });
        eventTriggered = true;
      }
    }
  }

  window.animationAPI = {
    animate: animateElement,
    classes: animationClasses.slice(2)
  };
})();