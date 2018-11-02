function bindEvent(options) {
  var element = typeof options.element === "string" ? document.querySelector(options.element) : options.element;
  if (element) {
    element.addEventListener(options.eventName || "click", function (ev) {
      if (typeof options.func === "function") {
        const context = options.context || element;
        options.func.call(context, ev, options);
      }
    });
  }
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

