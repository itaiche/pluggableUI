function bindEvent(options) {
  let element = typeof options.element === "string" ? document.querySelector(options.element) : options.element;
  if (element && typeof  options.func === 'function') {
    const context = typeof options.context !== 'undefined' ? options.context : element;
    element.addEventListener(options.eventName || "click", options.func.bind(context));
  }
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}