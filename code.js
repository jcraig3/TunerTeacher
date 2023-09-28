var audioContext;
var constraints = { audio: true };

navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
  try {
    audioContext = new AudioContext();
  } catch (e) {
    alert("Web Audio API is not supported in this browser");
  }
});

//print HZ to hz span
function changeHz() {
  document.getElementById("hz").textContent = "Hz here";
}

document.getElementById("btn").addEventListener("click", () => {
  changeHz();
});
