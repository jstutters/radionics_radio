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
var instructionsVisible = 0;
var knobImg;
var needleImg;

// on document load
$(document).ready(function() {
  createKnobs();
  createButtons();
  initialiseAudio();
  $(document).keypress(bodyKeyPress);
  loadImages();
});

function loadImages() {
  needleImg = new Image()
  needleImg.onerror = function() {
    console.log("error loading needleImg");
  }
  needleImg.onload = function() {
    $(".dial")
      .val(oscillatorFreq)
      .trigger('change');   
  };
  needleImg.src = "img/needle4.png";

  knobImg = new Image()
  needleImg.onerror = function() {
    console.log("error loading knobImg");
  }
  knobImg.onload = function() {
    $(".freqpresetknob")
      .val(1)
      .trigger('change');
    $(".volumeknob")
      .val(50)
      .trigger('change');
  };
  knobImg.src = "img/onoff_knob.png";
}

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
    'thickness': 0.03,
    'width': 250,
    'height': 250,
    'stopper': false,
    'cursor': 0.1,
    'change': freqnudgeChanged,
    'release': freqnudgeReleased,
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
  oscillatorFreq += 0.4;
  $(".dial").val(oscillatorFreq).trigger('change');
}

function decr() {
  oscillatorFreq -= 0.4;
  $(".dial").val(oscillatorFreq).trigger('change');
}

function deviceBackingPixelRatio(ctx) {
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
                          ctx.mozBackingStorePixelRatio ||
                          ctx.msBackingStorePixelRatio ||
                          ctx.oBackingStorePixelRatio ||
                          ctx.backingStorePixelRatio || 1;
  return devicePixelRatio / backingStoreRatio;
}

function drawMainFreqKnob() {
  this.g.translate(this.g.canvas.width / 2, this.g.canvas.height / 2 - 20);
  scaleFactor = 0.5 * deviceBackingPixelRatio(this.g);
  this.g.scale(scaleFactor, scaleFactor);
  this.g.rotate(this.startAngle + this.angle(this.cv) + 1.57);
  try {
    this.g.drawImage(needleImg, - needleImg.width / 2, -needleImg.height / 2);
  } catch (e) {
    console.log(e)
  }
  return false;
}

function drawFreqPresetKnob() {
  this.g.translate(this.g.canvas.width / 2, this.g.canvas.height / 2);
  scaleFactor = deviceBackingPixelRatio(this.g) * 0.5;
  this.g.scale(scaleFactor, scaleFactor);
  this.g.rotate(this.startAngle + this.angle(this.cv) - 0.7);
  try {
    this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  } catch(e) {
    console.log(e);
  }
  return false;
}

function drawVolumeKnob() {
  this.g.translate(this.g.canvas.width / 2, this.g.canvas.height / 2);
  scaleFactor = deviceBackingPixelRatio(this.g) * 0.5;
  this.g.scale(scaleFactor, scaleFactor);
  this.g.rotate(this.startAngle + this.angle(this.cv) - 0.7);
  try {
    this.g.drawImage(knobImg, -knobImg.width / 2, -knobImg.height / 2);
  } catch (e) {
    console.log(e);
  }
  return false;
}

function createButtons() {
  $("#audio_toggle_on").on("click", toggleOscillator);
  $("#audio_toggle_off").on("click", toggleOscillator);
  $("#show_instructions").on("click", function() {$("#instructions").show()});
  $("#hide_instructions").on("click", function() {$("#instructions").hide()});
  $("#storedfreqs").children('li').each(function() {
    $(this).on("click", selectedStoredFreq);
  });
  $("#start_button").on("click", function() {$("#start_banner").hide(); $("#instructions").show()});
  $("#sendfreqs").on("click", function() {fillSendForm(); $("#send_form").show()});
  $("#close_send_form").on("click", function() {$("#send_form").hide()});
}

function fillSendForm() {
  $("#thought").val($("#thoughttext").val());
  var freqs = "";
  $("#storedfreqs").children('li').each(function() {
    freqs += $(this).text() + "; ";
  }); 
  $("#frequencies").val(freqs);
}

function selectedStoredFreq() {
  console.log($(this));
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).css("list-style-image", "url('img/list-off.png')");
  storedFreqIdx = $("#storedfreqs li").index(this) + 1;
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).css("list-style-image", "url('img/list-on.png')");
}

function bodyKeyPress(ev) {
  console.log(ev.which);
  if (!$('textarea#thoughttext').is(":focus")) {
    if (ev.which == 49) {
      console.log("disabling textarea");
      $("#thoughttext").css("pointer-events", 'none');
      $("#freqnudge").css("visibility", "visible");
      scanning = true;
      $('#infknob').knob().children("canvas").trigger("mousedown")
    } else if (ev.which == 50) {
      console.log("cancelling search");
      scanning = false;
      $("#freqnudge").css("visibility", "hidden");
      $('#infknob').knob().children("canvas").trigger("mouseup")
    }
  }
}

function freqnudgeReleased() {
  console.log("enabling textarea")
  $("#thoughttext").css("pointer-events", 'all');
  $("#freqnudge").css("visibility", "hidden");
  if (scanning) {
    storeFrequency();
  }
  scanning = false;
}

// on store frequency click
function storeFrequency() {
  if (storedFreqIdx > 6) {
    return;
  }
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).text(storedFreqIdx.toString() + " = " + oscillatorFreq.toFixed(2).toString() + " Hz");
  $(selector).css("list-style-image", "url('img/list-off.png')");
  storedFreqIdx++;
  var selector = "ul#storedfreqs li:nth-child(" + storedFreqIdx.toString() +")";
  $(selector).css("list-style-image", "url('img/list-on.png')");
}

// on change of main frequency knob
function mainFreqChanged(val) {
  try {
    oscillator.frequency.value = val;
  } catch (e) {
    console.log(e);
  }
  oscillatorFreq = val;
  $("#freqreadout").text(oscillatorFreq.toFixed(2).toString() + " Hz");
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
    $("#audio_toggle_off").show();
    $("#audio_toggle_on").hide();
    $("#powerlight").attr("src", "img/lightoff.png")
  } else {
    if (createOscillator()) {
      $("#audio_toggle_on").show();
      $("#audio_toggle_off").hide();
      $("#powerlight").attr("src", "img/lighton.png")
    }
  }
}

function initialiseAudio() {
  // create web audio api context
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  console.log("audio initialised");
  console.log(audioCtx);
  if (audioCtx == null) {
    alert("Sorry, your browser does not support webaudio.  Please try the latest versions of Google Chrome, Mozilla Firefox or Apple Safari.");
  }
}

function createOscillator() {
  // create Oscillator node
  try {
    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain()
  } catch(e) {
    alert("Sorry, your browser does not support webaudio.  Please try the latest versions of Google Chrome, Mozilla Firefox or Apple Safari.");
    console.log(e);
    return false;
  }

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination)

  gainNode.gain.value = 0.5;
  oscillator.type = 'sine';
  oscillator.frequency.value = oscillatorFreq; // value in hertz
  try {
    oscillator.start(0);
  } catch(e) {
    oscillator.noteOn(0);
  }
  oscillatorRunning = true;
  return true;
} 

function doSubmit() {
  var data = {"thought": $("#thought").val(),
    "frequencies": $("#frequencies").val(),
    "username": $("#username").val
  };
  $.post("contact-form-handler.php", data);
  $("#send_form").hide();
  alert("Thankyou for your submission");
}
