/**
 * Created by itaic on 8/30/16.
 */
bindEvent({
    element: window, eventName: "load", func: function () {
        if (window.templates.keys) {
            randomizer.generate();
        } else {
            setTimeout(randomizer.generate, 200);
        }
    }
});