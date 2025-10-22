import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import io from "socket.io-client";
import {
  CAMERA_MODE,
  CameraMode,
  CONNECTION_PLACEHOLDER,
  ConnectionPlaceholder,
} from "@/ui/pages/room/config";

export const useConnection = ({ roomId }: { roomId: string, }) => {
  const initialized = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [ connectionState, setConnectionState ] = useState<ConnectionPlaceholder>(CONNECTION_PLACEHOLDER.CONNECTION);
  const [ permissionError, setPermissionError ] = useState<string | null>(null);

  const [ cameraFacing, setCameraFacing ] = useState<CameraMode>(CAMERA_MODE.USER);

  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    // Останавливаем текущие видео-треки
    localStreamRef.current.getVideoTracks().forEach((track) => track.stop());

    // Запрашиваем новый поток с другой камерой
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraFacing === CAMERA_MODE.USER ? CAMERA_MODE.ENV : CAMERA_MODE.USER },
        audio: true,
      });

      // Обновляем локальный поток
      localStreamRef.current = newStream;

      // Меняем источник видео
      if (localVideoRef.current) localVideoRef.current.srcObject = newStream;

      // Заменяем треки в PeerConnection
      const pc = pcRef.current;
      if (pc) {
        const senders = pc.getSenders().filter((s) => s.track?.kind === "video");
        senders.forEach((sender, i) => sender.replaceTrack(newStream.getVideoTracks()[ i ]));
      }

      // Обновляем состояние facing
      setCameraFacing((prev) => (prev === "user" ? "environment" : "user"));
    } catch (err) {
      console.error("Ошибка при переключении камеры:", err);
    }
  }, [ cameraFacing ]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

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

  return {
    localVideoRef,
    remoteVideoRef,
    pcRef,
    localStreamRef,
    socketRef,
    connectionState,
    permissionError,
    switchCamera,
  };
};
