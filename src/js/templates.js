(function () {
  let templates = {},
    known = ["ball", "plate", "rectangle", "triangle", "funkster"];


  function _init() {
    for (let i = 0; i < known.length; i++) {
      _loadTemplate(known[i]);
    }
  }

  function _loadTemplate(name) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "templates/" + name + ".html", true);
    xhr.addEventListener("load", _templateLoaded.bind(xhr, name), true);
    xhr.send(null);
  }

  function _templateLoaded(name) {
    if (this.readyState === 4) {
      templates[name] = this.responseText;
      window.templates.keys = Object.keys(templates);
    }
  }

  function generateTemplate(name = "ball", options = {wrapper: "span", styles: {position: "relative"}}) {
    let span = document.createElement(options.wrapper);
    let styles = options.styles;
    for (let key in styles) {
      if (styles.hasOwnProperty(key)) {
        span.style[key] = styles[key];
      }
    }
    if (options.className) {
      span.className = options.className;
    }
    span.innerHTML = templates[name];
    if (span.firstElementChild && options.child) {
      Object.keys(options.child).forEach(key => {
        if (name == 'triangle') {
          span.firstElementChild.style.borderBottomColor = options.child[key];
        }else {
          span.firstElementChild.style[key] = options.child[key];
        }
      });
    }
    return span;
  }

  window.templates = {
    generate: generateTemplate
  };

  _init();
})();