var audioContext;
var hz = document.getElementById("hz");
var startBtn = document.getElementById("btn");
var graph = document.getElementById("graph");
var slide = document.getElementById("slide");
var constraints = { audio: true };
var tuning = false;
var frequency;

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  try {
    audioContext = new window.AudioContext();
  } catch (e) {
    alert("Web Audio API is not supported in this browser");
  }
});

//print HZ to hz span
function changeHz() {
  hz.textContent = frequency;
}

slide.onmousedown = function () {
  playA();
  changeHz();
};

slide.onmouseup = function () {
  oscillator.disconnect();
};

startBtn.onclick = function () {
  if (tuning == false) {
    tuning = true;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  } else {
    tuning = false;
  }
};

function playA() {
  oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = slide.value; //frequency value in HZ
  frequency = oscillator.frequency.value;
  oscillator.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime);
}
