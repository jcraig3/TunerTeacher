window.AudioContext = window.AudioContext || window.webkitAudioContext;

//html elements
var hz, refhz, startBtn, graph, slide, note, info, change;

//audio context elements
var audioContext;
var analyser;
var source;
var constraints = { audio: true };
var bufferLength = 2048;
var buffer = new Float32Array(bufferLength);
const dataArray = new Uint8Array(bufferLength);

//reference elements
var tuning = false;
var pitch;
var noteIndex;
var changeNeeded;
var cents;
var frequency;
var reffrequency;
var noteName;
var noteArray = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

window.onload = function () {
  //html elements
  hz = document.getElementById("hz");
  refhz = document.getElementById("refhz");
  startBtn = document.getElementById("btn");
  slide = document.getElementById("slide");
  note = document.getElementById("note");
  info = document.getElementById("info");
  change = document.getElementById("change");

  //set up format of note info
  note.className = "pretune";
  note.textContent = "--";
  hz.textContent = "--";
  change.textContent = "--";
};

//when called, initialize audio context for stream
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

//refresh stream information and update frequency
function refresh() {
  analyser.getFloatTimeDomainData(buffer);
  pitch = autoCorrelate(buffer, audioContext.sampleRate);

  if (pitch == -1) {
    hz.textContent = "--";
    note.textContent = "--";
    change.textContent = "--";
  } else {
    frequency = Math.round(pitch);
    changeHz();
    updateNoteName(frequency);
    if (cents == 0) {
      note.className = "inTune";
    } else if (cents <= 10 && cents >= -10) {
      note.className = "closeTune";
    } else if (cents <= 25 && cents >= -25) {
      note.className = "nearTune";
    } else {
      note.className = "outTune";
    }
    updateChange(frequency, noteIndex);
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  window.requestAnimationFrame(refresh);
}

//print HZ to hz span
function changeHz() {
  hz.textContent = frequency;
}

//print refHZ to refhz span
function changeRefHz() {
  refhz.textContent = reffrequency;
}

//for slide reference notes
function slideDown() {
  playRef();
  changeRefHz();
}

//for slide reference notes
function slideUp() {
  oscillator.disconnect();
}

function refNoteDown(buttonFreq) {
  playRef(buttonFreq);
  changeRefHz();
}

function refNoteUp() {
  oscillator.disconnect();
}

//equation to get note name with research from https://pages.mtu.edu/~suits/NoteFreqCalcs.html
function getNote(frequency) {
  var noteValue = 12 * (Math.log(frequency / 440) / Math.log(2));
  noteIndex = Math.round(noteValue) + 69;
  var modded = noteIndex % 12;
  noteName = noteArray[modded];
  return noteName;
}

function updateNoteName(frequency) {
  var noteName = getNote(frequency);
  note.textContent = noteName;
}

function getFrequency(note) {
  var outPitch = 440 * Math.pow(2, (note - 69) / 12);
  return outPitch;
}

function getChangeNeeded(curFreq, note) {
  var freq = getFrequency(note);
  cents = Math.round((1200 * Math.log(curFreq / freq)) / Math.log(2));
  return cents;
}

function updateChange(frequency, note) {
  changeNeeded = getChangeNeeded(frequency, note);
  change.textContent = changeNeeded;
}

//for slide reference notes
function playSlideRef() {
  oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = slide.value; //frequency value in HZ
  reffrequency = oscillator.frequency.value;
  oscillator.connect(audioContext.destination);
  oscillator.start(audioContext.currentTime);
}

function playRef(buttonFreq) {
  oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  reffrequency = buttonFreq;
  oscillator.frequency.value = buttonFreq; //frequency value in HZ
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
  if (rms < 0.01) return -1;

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
