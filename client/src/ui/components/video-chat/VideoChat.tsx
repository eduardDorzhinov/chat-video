"use client";

import {
  FC, useEffect, useRef, useState,
} from "react";
import st from "./VideoChat.module.scss";
import { useRouter } from "next/navigation";
import { ROUTER } from "@/shared/constants";
import clsx from "clsx";
import { useConnection } from "@/shared/hooks/use-connection";

type Props = { roomId: string };

export const VideoChat: FC<Props> = ({ roomId }) => {
  const router = useRouter();

  const {
    localVideoRef,
    remoteVideoRef,
    pcRef,
    localStreamRef,
    socketRef,
    connectionState,
    permissionError,
  } = useConnection({ roomId });

  const [ micro, setMicro ] = useState(true);
  const [ camera, setCamera ] = useState(true);

  const [ showControls, setShowControls ] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMicro = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicro(track.enabled);
    });
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setCamera(track.enabled);
    });
  };

  const leaveRoom = () => {
    pcRef.current?.close();
    socketRef.current?.disconnect();
    router.push(ROUTER.HOME);
  };

  // const inviteOnClick = () => {
  //   const url = `${window.location.origin}/room/${roomId}`;
  //   navigator.clipboard.writeText(url);
  // };

  const toggleControls = () => {
    if (showControls) return;
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={st.videoWrapper}
      onClick={toggleControls}
    >
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={clsx(st.video, st.remoteVideo)}
      />

      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={clsx(st.video, st.localVideo)}
      />

      {
        showControls && (
          <div className={st.controlsOverlay}>
            <button onClick={toggleMicro}>
              {micro ? "🎤" : "🔇"}
            </button>
            <button onClick={toggleCamera}>
              {camera ? "📷" : "🚫"}
            </button>
            <button
              className={st.hangup}
              onClick={leaveRoom}
            >
              ❌
            </button>
          </div>
        )
      }
    </div>
  );
};
