import os
import sys
import json
from vosk import Model, KaldiRecognizer
import pyaudio

# Path to the Vosk model directory
MODEL_PATH = "src/python/vosk-model"

# Verify the Vosk model exists
if not os.path.exists(MODEL_PATH):
    print(f"Error: Model not found at {MODEL_PATH}. Please download and place the model files.", file=sys.stderr)
    sys.exit(1)

# Load the Vosk model
model = Model(MODEL_PATH)
recognizer = KaldiRecognizer(model, 16000)

def start_audio_stream():
    """Initialize the microphone stream for audio input."""
    audio = pyaudio.PyAudio()
    stream = audio.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=8000)
    stream.start_stream()
    return stream

# Start audio recognition
stream = start_audio_stream()
print("Listening for wake-up command...", file=sys.stderr)

while True:
    data = stream.read(4000, exception_on_overflow=False)
    if recognizer.AcceptWaveform(data):
        result = json.loads(recognizer.Result())
        text = result.get("text", "")
        print(f"Recognized: {text}", file=sys.stderr)

        # Send the "wake-up" signal to Electron
        if "hello" in text.lower():
            print("wake-up", flush=True)
