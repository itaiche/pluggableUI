audioPlayer.configure({
  files: window.files,
  onEnd: function () {
    changeBodyColor(generateColor(true));
  }
});

const courier = new Chronos.PostMessageCourier({
  onready: {
    callback: function () {
      bindMe();
    }
  }
});

function bindMe() {
  courier.bind({
    eventName: "animationComplete",
    appName: "animator",
    func: function (data) {
      audioPlayer.pause();
      let color = generateColor(true);
      if (data[window.myType]) {
        audioPlayer.play();
        color = "fuchsia";
      }
      changeBodyColor(color);
    }
  });
}

function changeBodyColor(color) {
  document.body.style.backgroundColor = color;
}
