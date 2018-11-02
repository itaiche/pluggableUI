(function () {
  let files = [],
    currentIndex = 0,
    audioElement,
    endCallbacks = [];

  if (document.readystate === "loaded") {
    _createAudioPlayer();
  } else {
    window.addEventListener("load", _createAudioPlayer, false);
  }


  function _createAudioPlayer() {
    audioElement = document.createElement("AUDIO");
    audioElement.style.position = "absolute";
    audioElement.style.top = "-1000px";
    audioElement.style.left = "-1000px";
    audioElement.autoplay = false;
    audioElement.controls = false;
    audioElement.controls = false;
    audioElement.volume = "1.0";
    audioElement.addEventListener("ended", function () {
      endCallbacks.forEach(callback => {
        try {
          callback({message: "playEnded"});
        } catch (e) {}
      });
    });
    document.body.appendChild(audioElement);
  }

  function configure(options) {
    if (options && options.files && options.files.constructor === Array) {
      files = JSON.parse(JSON.stringify(options.files));
    }
    if(options.onEnd){
      onEnd(options.onEnd);
    }
  }

  function play(fileName) {
    let finalFile;
    if (fileName && files.indexOf(fileName) > -1) {
      finalFile = fileName;
    } else if (files.length > 0) {
      currentIndex++;
      if (currentIndex >= files.length) {
        currentIndex = 0;
      }
      finalFile = files[currentIndex];
    }

    if (finalFile) {
      //audioElement.stop();
      audioElement.src = finalFile;
      audioElement.play();
    }
  }

  function pause(){
    audioElement.pause();
  }

  function onEnd(callback) {
    if (typeof  callback === 'function') {
      endCallbacks.push(callback);
    }
  }

  window.audioPlayer = {
    configure,
    play,
    pause,
    onEnd
  };
})();

