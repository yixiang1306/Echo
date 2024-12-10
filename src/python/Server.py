import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import OllamaLLM

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
