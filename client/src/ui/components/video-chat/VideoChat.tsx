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
import clsx from "clsx";
import { CONNECTION_PLACEHOLDER, ConnectionPlaceholder } from "@/ui/pages/room/config";

type Props = { roomId: string };

export const VideoChat: FC<Props> = ({ roomId }) => {
  const router = useRouter();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [ connectionState, setConnectionState ] = useState<ConnectionPlaceholder>(CONNECTION_PLACEHOLDER.CONNECTION);
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
    const init = async () => {
      let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL}/turn-credentials`);

        if (res.ok) {
          const data = await res.json();
          if (data?.iceServers) {
            iceServers = data.iceServers;
            console.log("🧊 Получены ICE-серверы:", iceServers);
          }
        } else {
          console.warn("⚠️ Не удалось получить TURN креды:", res.status);
        }
      } catch (err) {
        console.warn("⚠️ Ошибка при запросе TURN-кредов:", err);
      }

      /** Инициализируем Socket.IO */
      socketRef.current = io(process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL);
      const socket = socketRef.current;

      /** Создаём PeerConnection с динамическими ICE-серверами */
      pcRef.current = new RTCPeerConnection({ iceServers });
      const pc = pcRef.current;

      const sendCandidate = (c: RTCIceCandidate) => socket.emit("ice-candidate", { roomId, candidate: c });

      /** Отображаем поток, когда приходит от удалённого пользователя */
      pc.ontrack = (event) => {
        const [ remoteStream ] = event.streams;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      /** Отправляем ICE-кандидаты */
      pc.onicecandidate = (event) => {
        if (event.candidate) sendCandidate(event.candidate);
      };

      /** Обновляем статус соединения */
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log("📡 Состояние соединения:", state);
        switch (state) {
          case "connected":
            setConnectionState(CONNECTION_PLACEHOLDER.CONNECTED);
            break;
          case "disconnected":
          case "failed":
            setConnectionState(CONNECTION_PLACEHOLDER.FAILED);
            break;
          case "closed":
            setConnectionState(CONNECTION_PLACEHOLDER.CLOSED);
            break;
          default:
            setConnectionState(CONNECTION_PLACEHOLDER.CONNECTION);
        }
      };

      /** Получаем локальный поток */
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      setPermissionError(null);

      console.log("🎥 Локальный поток добавлен");

      /** События Socket.IO */
      socket.on("connect", () => {
        console.log("🟢 Подключено к signaling-серверу");
        socket.emit("join", roomId);
      });

      socket.on("ready", async () => {
        console.log("Комната готова — создаём offer (инициатор)");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, sdp: offer });
      });

      socket.on("offer", async (payload) => {
        console.log("📩 Получен offer (ответчик)");
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
    };

    init();
  }, [ roomId ]);

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
        <code>http://localhost:3000/room/{roomId}</code>
      </div>
    </div>
  );
};
