

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
        func: function (data) {
            var colors = ["transparent", "green", "red", "blue", "pink", "purple"];
            var color = getRandomFromArray(colors);
            if(data[window.myType]){
                audioPlayer.play();
                color = "fuchsia";
            }
            console.log("triggered in iFrame");
            document.body.style.backgroundColor = color;

        }
    });
    console.log("Bound to courier " + window.location.href)
}
