import os
import logging
import base64
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import OllamaLLM
from google.cloud import speech


load_dotenv()

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set
credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not credentials_path or not os.path.exists(credentials_path):
    raise EnvironmentError("GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or the file does not exist.")



@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio using Google Cloud Speech-to-Text.
    Expects JSON: { "audio": "<base64-encoded-audio>" }
    """
    data = request.json
    audio_base64 = data.get("audio")

    if not audio_base64:
        return jsonify({"error": "Audio data is required"}), 400

    # Decode the Base64 audio
    audio_content = base64.b64decode(audio_base64)

    # Configure Google Cloud Speech client
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,  # Ensure this matches your recording
        language_code="en-US",
    )

    try:
        # Perform speech-to-text
        response = client.recognize(config=config, audio=audio)
        transcript = " ".join([result.alternatives[0].transcript for result in response.results])
        return jsonify({"transcription": transcript})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


@app.route('/llm', methods=['POST'])
def llm_response():
    try:
        logging.info("Processing /llm request.")

        # Validate input
        text_input = request.json.get('text', '')
        if not text_input:
            logging.warning("No text input provided.")
            return jsonify({"status": "error", "message": "No text input provided"}), 400

        # Generate response from LLM
        llm_response = modal.invoke(text_input)

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
