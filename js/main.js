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

// on document load
$(document).ready(function() {
  createKnobs();
  createButtons();
  initialiseAudio();
  $(document).keypress(function(ev) {
    if (!$('textarea#thoughttext').is(":focus")) {
      console.log(ev.which);
    }
  })
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
    'width': 500,
    'height': 500
  });

  $(".infknob").knob({
    'min': 0,
    'max': 20,
    'width': 300,
    'height': 300,
    'stopper': false,
    'change': freqnudgeChanged
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
  }, 500);
}

function freqpresetChanged(val) {
    oscillatorFreq = Math.round(val) * 1000;
    console.log(val);
    $(".dial").val(oscillatorFreq).trigger('change');
    mainFreqChanged(oscillatorFreq);
}

function freqnudgeChanged() {
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
  this.g.translate(this.w / 2, this.h / 2);
  this.g.rotate(this.startAngle + this.angle(this.cv) + 1.57);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function drawFreqPresetKnob() {
  var knobImg = new Image();
  knobImg.src = "img/onoff_knob.png";
  this.g.translate(this.w / 2, this.h / 2);
  this.g.rotate(this.startAngle + this.angle(this.cv) - 0.7);
  this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  return false;
}

function createButtons() {
  $("#storefreq").on("click", storeFrequency);
  $("#disable_textarea").on("click", disableTextarea);
  $("#audio_toggle").on("click", toggleOscillator);
}

function disableTextarea() {
  $("#thoughttext").css("pointer-events", 'none');
}

// on store frequency click
function storeFrequency() {
    var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
    $(selector).text(oscillatorFreq.toString());
    storedFreqIdx++;
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
  } else {
    createOscillator();
    $("#audio_toggle").attr("src", "img/onoff.png");
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
