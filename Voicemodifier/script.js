let mediaRecorder;
let audioChunks = [];
let pitchShiftEffect, reverbEffect, echoEffect, backgroundMusicPlayer, mixedStream;
let isBgMusicEnabled = false;
let isEchoEnabled = false; // To track the echo effect state
let isRecording = false; // Flag to track the recording state

// Initialize Audio Effects
function initializeAudioEffects() {
  // Pitch Shift Effect
  pitchShiftEffect = new Tone.PitchShift().toDestination();

  // Reverb Effect
  reverbEffect = new Tone.Reverb({ decay: 1.5 }).toDestination();
  
  // Echo Effect (Delay)
  echoEffect = new Tone.FeedbackDelay(0.2, 0.5).toDestination();
  echoEffect.wet.value = 0; // Initially disabled

  const mic = new Tone.UserMedia();

  // Combine Microphone with Background Music
  const audioContext = Tone.context;
  const destination = audioContext.createMediaStreamDestination();
  const micNode = mic.toDestination();
  mic.connect(pitchShiftEffect).connect(reverbEffect).connect(echoEffect).connect(destination);

  // Pitch Shift Control
  const pitchShiftSlider = document.getElementById("pitchShift");
  pitchShiftSlider.addEventListener("input", (event) => {
    pitchShiftEffect.pitch = parseInt(event.target.value, 10);
    console.log("Pitch shift set to:", pitchShiftEffect.pitch);
  });

  // Reverb Control
  const reverbSlider = document.getElementById("reverbIntensity");
  reverbSlider.addEventListener("input", (event) => {
    reverbEffect.decay = parseFloat(event.target.value);
    console.log("Reverb intensity set to:", reverbEffect.decay);
  });

  // Echo Control Toggle Button
  const toggleEchoButton = document.getElementById("toggleEcho");
  toggleEchoButton.addEventListener("click", () => {
    isEchoEnabled = !isEchoEnabled;
    echoEffect.wet.value = isEchoEnabled ? 1 : 0; // Enable or disable the echo effect
    toggleEchoButton.textContent = isEchoEnabled ? "Disable Echo" : "Enable Echo";
    console.log("Echo effect enabled:", isEchoEnabled);
  });

  // Background Music Dropdown
  const backgroundMusicDropdown = document.getElementById("backgroundMusic");
  backgroundMusicDropdown.addEventListener("change", (event) => {
    if (backgroundMusicPlayer) {
      backgroundMusicPlayer.stop(); // Stop any previous track
    }

    const selectedTrack = event.target.value;
    if (selectedTrack !== "none") {
      backgroundMusicPlayer = new Tone.Player(`assets/${selectedTrack}.mp3`).toDestination();
      backgroundMusicPlayer.loop = true; // Loop the music during recording
      console.log("Background music track selected:", selectedTrack);
    }
  });

  // Background Music Toggle Button
  const toggleBgMusicButton = document.getElementById("toggleBgMusic");
  toggleBgMusicButton.addEventListener("click", () => {
    isBgMusicEnabled = !isBgMusicEnabled;
    toggleBgMusicButton.textContent = isBgMusicEnabled ? "Disable Background Music" : "Enable Background Music";
    console.log("Background music enabled:", isBgMusicEnabled);
  });

  // Enable mic when recording starts
  document.getElementById("startRecording").addEventListener("click", async () => {
    if (isRecording) return; // Prevent starting recording again if already recording
    isRecording = true; // Set the recording state to true

    document.getElementById("startRecording").disabled = true;
    document.getElementById("stopRecording").disabled = false;

    // Show recording indicator
    document.getElementById("recordingIndicator").style.display = 'block';

    await mic.open();
    mixedStream = destination.stream; // Use the mixed stream for recording
    console.log("Microphone connected.");

    // Start background music if enabled and a track is selected
    if (isBgMusicEnabled && backgroundMusicPlayer) {
      backgroundMusicPlayer.start();
      console.log("Background music started.");
    }

    mediaRecorder = new MediaRecorder(mixedStream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.start();
    console.log("Recording started...");
  });

  // Stop Recording
  document.getElementById("stopRecording").addEventListener("click", () => {
    if (!isRecording) return; // Prevent stopping if not recording
    isRecording = false;

    document.getElementById("startRecording").disabled = false;
    document.getElementById("stopRecording").disabled = true;

    // Hide recording indicator
    document.getElementById("recordingIndicator").style.display = 'none';

    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play(); // Playback the recording
        console.log("Recording stopped and mixed audio played back.");
      };
    }

    if (backgroundMusicPlayer) {
      backgroundMusicPlayer.stop();
      console.log("Background music stopped.");
    }
  });
}

// Initialize the audio effects
initializeAudioEffects();
