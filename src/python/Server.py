import os
import logging
import base64
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import OllamaLLM
from google.cloud import speech
from pydub import AudioSegment
import io
load_dotenv()


# Global list to hold conversation history
conversation_history = []

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set
credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not credentials_path or not os.path.exists(credentials_path):
    raise EnvironmentError("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or the file does not exist.")

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/llm": {"origins": "http://localhost:3000"}})

# Initialize Logger
logging.basicConfig(level=logging.INFO)

# Initialize LLM Model
try:
    modal = OllamaLLM(model="llama2")
    logging.info("OllamaLLM model initialized successfully.")
except Exception as e:
    logging.error(f"Error initializing OllamaLLM: {e}")
    exit(1)






@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio using Google Cloud Speech-to-Text.
    Expects JSON: { "audio": "<base64-encoded-audio>" }
    """
    data = request.json
    audio_base64 = data.get("audio")

    logging.info(f"Audio Base64 Length: {len(audio_base64)}")

    if not audio_base64:
        return jsonify({"error": "Audio data is required"}), 400

    # Decode the Base64 audio
    audio_content = base64.b64decode(audio_base64)
    
        # Detect and Convert to WAV if necessary
    try:
        audio_file = io.BytesIO(audio_content)
        audio = AudioSegment.from_file(audio_file)  # Automatically detects format
        if audio.frame_rate != 48000 or audio.sample_width != 2:
            logging.info("Converting audio to 48kHz, 16-bit PCM WAV")
            audio = audio.set_frame_rate(48000).set_sample_width(2)
        wav_data = io.BytesIO()
        audio.export(wav_data, format="wav")
        wav_data.seek(0)  # Reset buffer position for reading
        audio_content = wav_data.read()
    except Exception as e:
        logging.error(f"Error processing audio file: {e}")
        return jsonify({"error": "Invalid or unsupported audio format"}), 400


    # Save the decoded (or converted) audio to a file (optional, for debugging)
    with open("decoded_audio.wav", "wb") as audio_file:
        audio_file.write(audio_content)

    # Configure Google Cloud Speech client
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=48000,  # Ensure this matches your recording
        language_code="en-US",
    )

    try:
        logging.info(f"Speech Config: {config}")
        logging.info(f"Audio Content Length: {len(audio_content)}")
        # Perform speech-to-text
        response = client.recognize(config=config, audio=audio)
        logging.info(f"Speech-to-Text Response: {response}")
        transcript = " ".join([result.alternatives[0].transcript for result in response.results])
        logging.info(f"Audio transcript: {transcript}")
        
        return jsonify({"transcription": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/llm', methods=['POST'])
def llm_response():
    try:
  

        # Validate input
        text_input = request.json.get('text', '')
        if not text_input:
            logging.warning("No text input provided.")
            return jsonify({"status": "error", "message": "No text input provided"}), 400


         # Append user message to conversation history
        conversation_history.append({"role": "user", "content": text_input})
   
        # Format the conversation history for the LLM
        context_input = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        llm_response = modal.invoke(context_input)

        # Append LLM's response to conversation history
        conversation_history.append({"role": "assistant", "content": llm_response})

        # Append LLM's response to conversation history
        llm_response = modal.invoke(context_input);

        # Trim the conversation history to the last 20 messages for memory efficiency
        if len(conversation_history) > 20:
            conversation_history[:] = conversation_history[-20:]


        logging.info("LLM response generated successfully.")
        print(llm_response)
        return jsonify({"llm_response": llm_response})

    except Exception as e:
        logging.error(f"Error processing /llm request: {e}")
        return jsonify({"status": "error", "message": "Internal Server Error"}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    logging.info(f"Starting server on port {port}.")
    app.run(port=port)
