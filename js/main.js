// globals
var oscillator;
var gainNode;
var audioCtx;
var oscillatorRunning = false;
var oscillatorFreq = 50;
var i = 0;
var v;
var up = 0;
var down = 0;

// on document load
$(document).ready(function() {
  createKnobs();
  createButtons();
  initialiseAudio();
  createOscillator();
});

// create the various knobs
function createKnobs() {
  // main frequency knob
  $(".dial").knob({
    'min': 1000,
    'max': 4000,
    'angleOffset': 270,
    'angleArc': 180,
    'displayInput': false,
    'change': mainFreqChanged,
    'draw': drawImageKnob,
    'width': 500,
    'height': 500
  });
  $(".dial")
    .val(oscillatorFreq)
    .trigger('change');

  $(".infknob").knob({
    'min': 0,
    'max': 20,
    'stopper': false,
    'change': freqnudgeChanged
  })

  $(".freqrangeknob").knob({
    'min': 1000,
    'max': 4000,
    'angleOffset': 300,
    'angleArc': 120,
    'step': 1000,
    'change': freqrangeChanged
  })
}

function freqrangeChanged(val) {
  console.log(val % 1000);
  if (val % 1000 == 0) {
    $(".dial").val(val).trigger('change');
  }
}

function freqnudgeChanged() {
  console.log("changed");
  if (v > this.cv) {
    if (up) {
      console.log('decr')
      decr();
      up = 0;
    } else {
      up = 1;
      down = 0;
    }
  } else {
    if (v < this.cv) {
      if (down) {
        incr();
        down = 0;
      } else {
        down = 1;
        up = 0;
      }
    }
  }
  v = this.cv;
}

function incr() {
  var newfreq = oscillator.frequency.value + 1;
  oscillator.frequency.value = newfreq;
  $(".dial").val(newfreq).trigger('change');
}

function decr() {
  var newfreq = oscillator.frequency.value - 1;
  oscillator.frequency.value = newfreq;
  $(".dial").val(newfreq).trigger('change');
}

function drawImageKnob() {
  var knobImg = new Image();
  knobImg.src = "img/needle4.png";
  console.log(this.g.width);
  this.g.translate(this.w / 2, this.h / 2);
  this.g.rotate(this.startAngle + this.angle(this.cv) + 1.57);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function createButtons() {
  $("#audio_toggle").on("click", toggleOscillator);
}

// on change of main frequency knob
function mainFreqChanged(val) {
  oscillator.frequency.value = val;
  console.log("setting frequency to", val);
}

function toggleOscillator() {
  if (oscillatorRunning) {
    try {
      oscillator.stop();
    } catch(e) {
      oscillator.noteOff(0)
    }
    oscillatorRunning = false;
  } else {
    createOscillator();
  }
}

function initialiseAudio() {
  // create web audio api context
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  console.log("audio initialised");
}

function createOscillator() {
  // create Oscillator node
  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain()

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination)

  gainNode.gain.value = 0.01;
  oscillator.type = 'square';
  oscillator.frequency.value = oscillatorFreq; // value in hertz
  try {
    oscillator.start(0);
  } catch(e) {
    oscillator.noteOn(0);
  }
  oscillatorRunning = true;
} 
