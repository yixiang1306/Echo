import React, { useState, useEffect } from "react";

const VoiceCommand: React.FC = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(
    null
  );

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = false;
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const speechToText = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        setTranscript(speechToText);
      };
      recognitionInstance.onerror = (error: any) => {
        console.error("Speech recognition error:", error);
      };
      setRecognition(recognitionInstance);
    } else {
      alert("Speech Recognition is not supported in your browser.");
    }
  }, []);

  const handleStartListening = () => {
    if (recognition) {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div>
      <h1>Speech to Text</h1>
      <button
        onClick={isListening ? handleStopListening : handleStartListening}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: isListening ? "red" : "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        {isListening ? "Stop Recording" : "Start Recording"}
      </button>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3>Transcript:</h3>
        <p>{transcript || "Press the button and speak..."}</p>
      </div>
    </div>
  );
};

export default VoiceCommand;
