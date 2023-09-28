var audioContext;
var hz = document.getElementById("hz");
var startBtn = document.getElementById("btn");
var constraints = { audio: true };

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  try {
    audioContext = new window.AudioContext();
  } catch (e) {
    alert("Web Audio API is not supported in this browser");
  }
});

//print HZ to hz span
function changeHz() {
  hz.textContent = "Hz here";
}

startBtn.addEventListener("click", () => {
  changeHz();
});

startBtn.onclick = function () {
  oscillator = audioContext.createOscillator(); //creates oscillator
  oscillator.type = "sine"; //chooses the type of wave
  oscillator.frequency.value = 110; //assigning the value of oscPitch to the oscillators frequency value
  oscillator.connect(audioContext.destination); //sends to output
  oscillator.start(audioContext.currentTime); //starts the sound at the current time
};
