console.log("I am " +  window.location.href);
audioPlayer.configure({
    files : window.files
});

var courier = new Chronos.PostMessageCourier({
    onready: {
        callback: function(){
            bindMe();
            console.log('IFrame ready....')
        }
    }
});
console.log("Created courier " + window.location.href)

function bindMe() {
    courier.bind({
        eventName: "animationComplete",
        appName: "animator",
        func: function () {
            console.log("triggered in iFrame");
            var colors = ["transparent", "green", "red", "blue", "pink", "purple"];
            document.body.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            audioPlayer.play();
        }
    });
    console.log("Bound to courier " + window.location.href)
}
