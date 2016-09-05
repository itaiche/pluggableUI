(function(){

    let files = [];
    let currentIndex = 0;
    let audioElement;

    if(document.readystate === "loaded"){
        _createAudioPlayer();
    }else{
        window.addEventListener("load", _createAudioPlayer, false);
    }

    function _createAudioPlayer(){
        audioElement = document.createElement("AUDIO");
        audioElement.style.position = "absolute";
        audioElement.style.top = "-1000px";
        audioElement.style.left = "-1000px";
        audioElement.autoplay = false;
        audioElement.controls = false;
        audioElement.controls = false;
        audioElement.volume = "1.0";
        document.body.appendChild(audioElement);
    }

    function configure(options){
        if(options && options.files && options.files.constructor === Array){
            files = JSON.parse(JSON.stringify(options.files));
        }
    }

    function play(fileName) {
        var hasFile = false;
        var finalFile;
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
            stop();
            audioElement.src = finalFile;
            audioElement.play();
        }
    }

    function stop(){
        if(audioElement){
            audioElement.pause();
        }
    }

    window.audioPlayer = {
        configure: configure,
        play: play,
        stop: stop
    };
})();

