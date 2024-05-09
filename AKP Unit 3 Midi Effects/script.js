import {musicTools} from "./MusicTools.js";

await WebMidi.enable();

const audCtx = new (AudioContext || webkit.AudioContext)();

let midiInput = WebMidi.inputs[0];

const inputLevel = audCtx.createGain();
const volume = audCtx.createGain();

const delay = audCtx.createDelay(5.0);
const feedback = audCtx.createGain();
delay.delayTime.setValueAtTime(0.25, audCtx.currentTime); // Set initial delay time.
feedback.gain.setValueAtTime(0.25, audCtx.currentTime); // Set initial delay feedback level.

inputLevel.connect(delay);
delay.connect(feedback);
feedback.connect(delay);
delay.connect(volume);
// feedback.connect(volume);
volume.connect(audCtx.destination);


const attackTime = 0.02; // Attack time in seconds
const decayTime = 0.1; // Decay time in seconds
const sustainLevel = 0.5; // Sustain level (0 to 1)
const releaseTime = 0.25; // Release time in seconds

const activeVoices = new Map();

const startTone = function(note) {

    let oscillator = audCtx.createOscillator();
    const gainNode = audCtx.createGain();

    gainNode.gain.value = 0;

    console.log(musicTools.midiPitchToFrequency(note.number));
    oscillator.frequency.setValueAtTime(musicTools.midiPitchToFrequency(note.number), audCtx.currentTime);

    oscillator.type = 'sine';

    oscillator.connect(gainNode);
    gainNode.connect(inputLevel);

    oscillator.start();
    gainNode.gain.linearRampToValueAtTime(note.attack, audCtx.currentTime + attackTime);
    gainNode.gain.linearRampToValueAtTime(note.attack*sustainLevel, audCtx.currentTime + attackTime + decayTime);

    setTimeout(()=> {
        //console.log(`gain: ${gainNode.gain.value}`)
    }, (attackTime + decayTime) * 1000);

    activeVoices.set(note.number, {oscillator, gainNode});
}

/**
 * This function stops playing a tone given a MIDI note.
 * @param {object} note - The MIDI note to stop.
 */
const stopTone = function(note) {
    const voice = activeVoices.get(note.number);

    if (voice) {
        //console.log(`gain: ${voice.gainNode.gain.value}`)

        voice.gainNode.gain.linearRampToValueAtTime(0., audCtx.currentTime + releaseTime);

        setTimeout(() => {
            voice.oscillator.stop();

            voice.oscillator.disconnect();

            activeVoices.delete(note.number);
        }, (releaseTime + 1) * 1000);
    }
}

let dropIns = document.getElementById("dropIns");

WebMidi.inputs.forEach(function (input, num) {

    dropIns.innerHTML += `<option value=${num}>${input.name}</option>`;
});

dropIns.addEventListener("change", function () {
    if (midiInput.hasListener("noteon")) {
        midiInput.removeListener("noteon");
    }
    if (midiInput.hasListener("noteoff")) {
        midiInput.removeListener("noteoff");
    }

    midiInput = WebMidi.inputs[dropIns.value];

    midiInput.addListener("noteon", function (someMIDI) {
        startTone(someMIDI.note)
    });
    midiInput.addListener("noteoff", function (someMIDI) {
        stopTone(someMIDI.note)
    });
});

let sineElement = document.getElementById("sine");
sineElement.addEventListener("change", function() {
    if (this.checked) {
        oscillator.type = 'sine';
    }

});

let sawElement = document.getElementById("saw");
sawElement.addEventListener("change", function() {
    if (this.checked) {
        oscillator.type = 'sawtooth';
    }

});

let squareElement = document.getElementById("square");
squareElement.addEventListener("change", function() {
    if (this.checked) {
        oscillator.type = 'square';
    }

});

let triangleElement = document.getElementById("triangle");
triangleElement.addEventListener("change", function() {
    if (this.checked) {
        oscillator.type = 'triangle';
    }

});



let inputElement = document.getElementById("inputGain");
inputElement.addEventListener("input", function() {
    inputLevel.gain.linearRampToValueAtTime(musicTools.dbfsToLinearAmplitude(parseFloat(this.value)), audCtx.currentTime + 0.02);
    document.getElementById("inputDisplay").innerText = `${this.value} dBFS`;
});


let delayTimeElement = document.getElementById("delayTime");
delayTimeElement.addEventListener("input", function() {
    delay.delayTime.linearRampToValueAtTime(parseFloat(this.value), audCtx.currentTime + 0.2);
    document.getElementById("delayTimeDisplay").innerText = `${this.value} sec`;
});

let feedbackElement = document.getElementById("feedback");
feedbackElement.addEventListener("input", function() {
    feedback.gain.linearRampToValueAtTime(parseFloat(this.value), audCtx.currentTime + 0.02);
    document.getElementById("feedbackDisplay").innerText = `${parseInt(this.value*100)}%`;
});


let volumeElement = document.getElementById("vol");
volumeElement.addEventListener("input", function() {
    volume.gain.linearRampToValueAtTime(musicTools.dbfsToLinearAmplitude(parseFloat(this.value)), audCtx.currentTime + 0.02);
    document.getElementById("volDisplay").innerText = `${this.value} dBFS`;
});


let startAudioButton = document.getElementById("startAudio");
startAudioButton.addEventListener("click", function() {
    audCtx.resume();
});