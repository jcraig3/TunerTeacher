const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
var analyser = audioContext.createAnalyser();
var source;

//from API site
function getLocalStream() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      window.localStream = stream; // A
      window.localAudio.srcObject = stream; // B
      window.localAudio.autoplay = true; // C

      source = audioContext.createMediaStreamSource(stream);
    })
    .catch((err) => {
      console.error(`mic access needed: ${err}`);
    });
}
getLocalStream();
