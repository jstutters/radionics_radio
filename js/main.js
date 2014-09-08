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
var storedFreqIdx = 1;
var scanning = false;

// on document load
$(document).ready(function() {
  createKnobs();
  createButtons();
  initialiseAudio();
  $(document).keypress(bodyKeyPress);
});

// create the various knobs
function createKnobs() {
  // main frequency knob
  $(".dial").knob({
    'min': 50,
    'max': 5000,
    'angleOffset': 270,
    'angleArc': 180,
    'displayInput': false,
    'change': mainFreqChanged,
    'draw': drawMainFreqKnob,
    'width': 350,
    'height': 350
  });

  $(".volumeknob").knob({
    'min': 0,
    'max': 100,
    'angleOffset': 200,
    'angleArc': 320,
    'displayInput': false,
    'change': volumeChanged,
    'draw': drawVolumeKnob,
    'width': 120,
    'height': 120
  });

  $(".infknob").knob({
    'min': 0,
    'max': 20,
    'thickness': 0.01,
    'width': 250,
    'height': 250,
    'stopper': false,
    'change': freqnudgeChanged,
    'release': freqnudgeReleased
  })

  $(".freqpresetknob").knob({
    'min': 1,
    'max': 4,
    'angleOffset': 300,
    'angleArc': 100,
    'displayInput': false,
    'step': 1,
    'change': freqpresetChanged,
    'draw': drawFreqPresetKnob,
    'width': 100,
    'height': 100,
  })

  window.setTimeout(function() {
    $(".dial")
      .val(oscillatorFreq)
      .trigger('change');
    $(".freqpresetknob")
      .val(1)
      .trigger('change');
    $(".volumeknob")
      .val(1)
      .trigger('change');
  }, 500);
}

function freqpresetChanged(val) {
  oscillatorFreq = Math.round(val) * 1000;
  console.log(val);
  $(".dial").val(oscillatorFreq).trigger('change');
  mainFreqChanged(oscillatorFreq);
}

function volumeChanged(val) {
  try {
    gainNode.gain.value = val / 100.0;
  } catch (e) {
    console.log(e);
  }
}

function freqnudgeChanged() {
  if (!scanning) {
    return;
  }
  if (v > this.cv) {
    if (up) {
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
  mainFreqChanged(oscillatorFreq);
}

function incr() {
  oscillatorFreq++;
  $(".dial").val(oscillatorFreq).trigger('change');
}

function decr() {
  oscillatorFreq--;
  $(".dial").val(oscillatorFreq).trigger('change');
}

function drawMainFreqKnob() {
  var knobImg = new Image();
  knobImg.src = "img/needle4.png";
  this.g.translate(this.w / 2, this.h / 2 - 20);
  this.g.scale(0.5, 0.5);
  this.g.rotate(this.startAngle + this.angle(this.cv) + 1.57);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function drawFreqPresetKnob() {
  var knobImg = new Image();
  knobImg.src = "img/onoff_knob.png";
  this.g.translate(this.w / 2 + 5, this.h / 2);
  this.g.rotate(this.startAngle + this.angle(this.cv) - 0.7);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function drawVolumeKnob() {
  var knobImg = new Image();
  knobImg.src = "img/onoff_knob.png";
  this.g.translate(this.w / 2, this.h / 2);
  this.g.rotate(this.startAngle + this.angle(this.cv) - 0.7);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function createButtons() {
  $("#storefreq").on("click", storeFrequency);
  $("#audio_toggle").on("click", toggleOscillator);
}

function bodyKeyPress(ev) {
  console.log(ev.which);
  if (!$('textarea#thoughttext').is(":focus")) {
    if (ev.which == 49) {
      console.log("disabling textarea")
      $("#thoughttext").css("pointer-events", 'none');
      scanning = true;
      var infknob = $('#infknob').knob().children("canvas").trigger("mousedown")
    }
  }
}

function freqnudgeReleased() {
  console.log("enabling textarea")
  $("#thoughttext").css("pointer-events", 'all');
  scanning = false;
  storeFrequency();
}

function dispatchMouseEvent(target, var_args) {
  var e = document.createEvent("MouseEvents");
  e.initEvent.apply(e, Array.prototype.slice.call(arguments, 1));
  console.log(target);
  target.dispatchEvent(e);
}

// on store frequency click
function storeFrequency() {
  if (storedFreqIdx > 6) {
    return;
  }
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).text(storedFreqIdx.toString() + " = " + oscillatorFreq.toString() + " Hz");
  $(selector).css("list-style-image", "url('../img/list-off.png')");
  storedFreqIdx++;
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).css("list-style-image", "url('../img/list-on.png')");
}

// on change of main frequency knob
function mainFreqChanged(val) {
  try {
    oscillator.frequency.value = val;
  } catch (e) {
    console.log(e);
  }
  oscillatorFreq = val;
  console.log("setting frequency to", val);
}

function toggleOscillator() {
  console.log("toggleOscillator");
  if (oscillatorRunning) {
    try {
      oscillator.stop();
    } catch(e) {
      oscillator.noteOff(0)
    }
    oscillatorRunning = false;
    $("#audio_toggle").attr("src", "img/offon.png");
    $("#powerlight").attr("src", "img/lightoff.png")
  } else {
    createOscillator();
    $("#audio_toggle").attr("src", "img/onoff.png");
    $("#powerlight").attr("src", "img/lighton.png")
  }
}

function initialiseAudio() {
  // create web audio api context
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  console.log("audio initialised");
}

function createOscillator() {
  // create Oscillator node
  try {
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain()
  } catch(e) {
    return
  }

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
