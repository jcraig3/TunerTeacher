window.AudioContext = window.AudioContext || window.webkitAudioContext;

//html elements
var hz, refhz, startBtn, graph, slide, note, info;

var audioContext;
var analyser;
var source;

var constraints = { audio: true };
var tuning = false;
var frequency;
var reffrequency;
var pitch;

var bufferLength = 2048;
var buffer = new Float32Array(bufferLength);
const dataArray = new Uint8Array(bufferLength);

window.onload = function () {
  //html elements
  hz = document.getElementById("hz");
  refhz = document.getElementById("refhz");
  startBtn = document.getElementById("btn");
  graph = document.getElementById("graph");
  slide = document.getElementById("slide");
  note = document.getElementById("note");
  info = document.getElementById("info");
};

function start() {
  if (tuning == false) {
    tuning = true;
    audioContext = new window.AudioContext();
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      try {
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        refresh();
      } catch (e) {
        alert("Web Audio API is not supported in this browser");
      }
    });
  } else {
    tuning = false;
  }
}

function refresh() {
  analyser.getFloatTimeDomainData(buffer);
  var ac = autoCorrelate(buffer, audioContext.sampleRate);

  if (ac == -1) {
    hz.textContent = "--";
  } else {
    frequency = Math.round(ac);
    changeHz();
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  window.requestAnimationFrame(refresh);
}

//print HZ to hz span
function changeHz() {
  hz.textContent = frequency;
}

function changeRefHz() {
  refhz.textContent = reffrequency;
}

function slideDown() {
  playRef();
  changeRefHz();
}

function slideUp() {
  oscillator.disconnect();
}

function playRef() {
  oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = slide.value; //frequency value in HZ
  reffrequency = oscillator.frequency.value;
  oscillator.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime);
}

//Pitch algorithm ACF2+ from pitch detection repo
function autoCorrelate(buf, sampleRate) {
  var SIZE = buf.length;
  var rms = 0;

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01)
    // not enough signal
    return -1;

  var r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2;
  for (var i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  for (var i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  var c = new Array(SIZE).fill(0);
  for (var i = 0; i < SIZE; i++)
    for (var j = 0; j < SIZE - i; j++) c[i] = c[i] + buf[j] * buf[j + i];

  var d = 0;
  while (c[d] > c[d + 1]) d++;
  var maxval = -1,
    maxpos = -1;
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  var T0 = maxpos;

  var x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1];
  a = (x1 + x3 - 2 * x2) / 2;
  b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}
