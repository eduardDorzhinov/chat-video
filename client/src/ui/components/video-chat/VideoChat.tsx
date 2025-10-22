"use client";

import { FC, useState } from "react";
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

  const inviteOnClick = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className={st.container}>
      <h1 className={st.title}>🎥 Комната {roomId}</h1>
      <div className={st.status}>{connectionState}</div>

      {
        permissionError && (
          <div className={st.error}>
            Нет доступа к камере/микрофону: {permissionError}
          </div>
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
            className={clsx(st.video, st.mirror)}
          />
        </div>

        <div className={st.videoBox}>
          <div className={st.label}>Удалённое</div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={st.video}
          />
        </div>
      </div>

      <div className={st.controls}>
        <button onClick={toggleMicro}>
          {micro ? "🎤 Выкл. микрофон" : "🎤 Вкл. микрофон"}
        </button>

        <button onClick={toggleCamera}>
          {camera ? "📷 Выкл. камеру" : "📷 Вкл. камеру"}
        </button>

        <button onClick={leaveRoom}>
          ❌ Выйти из комнаты
        </button>
      </div>

      <div className={st.hint}>
        Отправь другу ссылку:
        {" "}
        <code>{`${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`}</code>

        <button
          className={st.copy_button}
          onClick={inviteOnClick}
        >
          📋 Скопировать
        </button>
      </div>
    </div>
  );
};
