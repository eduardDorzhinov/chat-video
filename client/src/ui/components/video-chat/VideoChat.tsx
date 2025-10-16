"use client";

import {
  FC,
  useEffect,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import st from "./VideoChat.module.scss";
import { useRouter } from "next/navigation";
import { ROUTER } from "@/shared/constants";

// TODO to env
const SIGNALING_SERVER_URL = "http://localhost:5001";

type Props = { roomId: string };

export const VideoChat: FC<Props> = ({ roomId }) => {
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [ permissionError, setPermissionError ] = useState<string | null>(null);

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

  useEffect(() => {
    socketRef.current = io(SIGNALING_SERVER_URL);
    const socket = socketRef.current;

    const sendCandidate = (c: RTCIceCandidate) => socket.emit("ice-candidate", { roomId, candidate: c });

    pcRef.current = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }]});
    const pc = pcRef.current;

    /** Отображаем поток, когда приходит от удалённого пользователя */
    pc.ontrack = (event) => {
      const [ remoteStream ] = event.streams;
      if (!remoteVideoRef.current) return;
      remoteVideoRef.current.srcObject = remoteStream;
    };

    /** Отправляем ICE-кандидаты */
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      sendCandidate(event.candidate);
    };

    /** Получаем локальный медиа-поток */
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        /** Добавляем треки */
        stream
          .getTracks()
          .forEach((track) => pc.addTrack(track, stream));
        setPermissionError(null);
        console.log("🎥 Локальный поток добавлен");
      } catch (err) {
        console.error("Ошибка доступа к устройствам:", err);
        setPermissionError("Доступ к камере/микрофону запрещён");
      }
    };

    initMedia();

    /** Обработка signaling событий */
    socket.on("connect", () => {
      console.log("🟢 Подключено к signaling-серверу");
      socket.emit("join", roomId);
    });

    socket.on("ready", async () => {
      console.log("Комната готова — создаём offer (инициатор)");
      /** Дожидаемся, что поток уже готов */
      if (!localStreamRef.current) {
        console.log("⏳ Ждём локальный поток...");
        await new Promise((r) => {
          const check = setInterval(() => {
            if (localStreamRef.current) {
              clearInterval(check);
              r(null);
            }
          }, 200);
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, sdp: offer });
    });

    socket.on("offer", async (payload) => {
      console.log("📩 Получен offer (ответчик)");

      /** Дожидаемся локальных треков перед answer */
      if (!localStreamRef.current) {
        console.log("⏳ Ждём локальный поток перед answer...");
        await new Promise((r) => {
          const check = setInterval(() => {
            if (localStreamRef.current) {
              clearInterval(check);
              r(null);
            }
          }, 200);
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, sdp: answer });
    });

    socket.on("answer", async (payload) => {
      console.log("📩 Получен answer (инициатор)");
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });

    socket.on("ice-candidate", async (payload) => {
      try {
        await pc.addIceCandidate(payload.candidate);
        console.log("Добавлен ICE-кандидат");
      } catch (err) {
        console.error("Ошибка ICE:", err);
      }
    });

    return () => {
      console.log("🔻 Завершение соединения");
      socket.disconnect();
      pc.close();
    };
  }, [ roomId ]);

  return (
    <div className={st.container}>
      <h1 className={st.title}>🎥 Комната {roomId}</h1>

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
            className={st.video}
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
        <code>http://localhost:3000/room/{roomId}</code>
      </div>
    </div>
  );
};
