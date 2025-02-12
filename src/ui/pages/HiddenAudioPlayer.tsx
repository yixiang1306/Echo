import React, { useEffect, useRef } from "react";

const HiddenAudioPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Ensure the `electronAPI` is available in the global context (exposed by preload.js)
    //@ts-ignore
    if (!window.audioManagerAPI) {
      console.error("electronAPI is not available in the global context.");
      return;
    }

    // Handle 'play-audio' event
    //@ts-ignore
    window.audioManagerAPI.onPlayAudio((audioBase64: string) => {
      if (audioRef.current) {
        //@ts-ignore
        const audioBlob = new Blob([window.nodeAPI.Buffer(audioBase64)], {
          type: "audio/mp3",
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set the audio source and play the audio
        audioRef.current.src = audioUrl;
        audioRef.current
          .play()
          .then(() => console.log("Audio playback started."))
          .catch((err) => console.error("Error starting audio playback:", err));
      }
    });

    // Handle 'stop-audio' event
    //@ts-ignore
    window.audioManagerAPI.onStopAudio(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset playback position
        console.log("Audio playback stopped.");
      }
    });

    // Handle audio finish event
    const handleAudioFinish = () => {
      //@ts-ignore
      window.audioManagerAPI.endAudio();
      console.log("Audio playback finished.");
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handleAudioFinish);
    }

    // Cleanup listeners when the component is unmounted
    return () => {
      //@ts-ignore
      window.audioManagerAPI.removePlayAudioListener();
      //@ts-ignore
      window.audioManagerAPI.removeStopAudioListener();

      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleAudioFinish);
      }
    };
  }, []);

  return <audio ref={audioRef} style={{ display: "none" }} />;
};

export default HiddenAudioPlayer;
