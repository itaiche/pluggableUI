
function bindEvent(options){
    var element = typeof options.element === "string" ? document.querySelector(options.element) : options.element;
    if(element){
        element.addEventListener(options.eventName || "click", function(ev){
            if(typeof options.func === "function"){
                options.func.call(options.context || window, ev , options);
            }
        });
    }
}
