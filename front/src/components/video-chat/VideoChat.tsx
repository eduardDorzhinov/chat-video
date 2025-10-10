"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import st from "./VideoChat.module.scss";

export const VideoChat = () => {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [ pc, setPc ] = useState<RTCPeerConnection | null>(null);
  const [ permissionError, setPermissionError ] = useState<string | null>(null);

  useEffect(() => {
    const start = async () => {
      try {
        const peerConnection = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }]});
        setPc(peerConnection);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("ICE candidate:", event.candidate);
          }
        };
      } catch (err: any) {
        console.error("getUserMedia error:", err);
        setPermissionError(err?.message ?? "Не удалось получить доступ к камере/микрофону");
      }
    };

    start();

    return () => {
      pc?.getSenders().forEach((s) => s.track?.stop());
      pc?.close();
    };
  // eslint-disable-next-line
  }, []);

  return (
    <div className={st.container}>
      <h1 className={st.title}>🎥 Мини-видеочат (2 участника)</h1>

      {
        permissionError && (
          <div className={st.error}>Нет доступа к камере/микрофону: {permissionError}</div>
        )
      }

      <div className={st.videos}>
        <div className={st.videoBox}>
          <div className={st.label}>Локальное</div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={st.video}
          />
        </div>
      </div>

    </div>
  );
};
