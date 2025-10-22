import {
  useEffect, useRef, useState,
} from "react";
import io from "socket.io-client";
import { CONNECTION_PLACEHOLDER, ConnectionPlaceholder } from "@/ui/pages/room/config";

export const useConnection = ({ roomId }: { roomId: string }) => {
  const initialized = useRef(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [ connectionState, setConnectionState ] = useState<ConnectionPlaceholder>(CONNECTION_PLACEHOLDER.CONNECTION);
  const [ permissionError, setPermissionError ] = useState<string | null>(null);

  const [ cameraFacing, setCameraFacing ] = useState<"user" | "environment">("user");
  const [ hasMultipleCameras, setHasMultipleCameras ] = useState(false);
  const [ micro, setMicro ] = useState(true);
  const [ camera, setCamera ] = useState(true);

  const initLocalStream = async (facing: "user" | "environment" = "user") => {
    try {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      setHasMultipleCameras(videoInputs.length > 1);

      setCameraFacing(facing);
      setCamera(true);
      setMicro(true);

      return stream;
    } catch (err) {
      console.error("Ошибка доступа к камере/микрофону:", err);
      setPermissionError("Нет доступа к камере/микрофону");
      return null;
    }
  };

  const switchCamera = async () => {
    if (!localStreamRef.current) return;

    const newFacing = cameraFacing === "user" ? "environment" : "user";
    const newStream = await initLocalStream(newFacing);

    if (!newStream || !pcRef.current) return;

    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
    if (sender) sender.replaceTrack(newStream.getVideoTracks()[ 0 ]);
  };

  const toggleMicro = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setMicro(track.enabled);
    });
  };

  const toggleCamera = () => {
    if (!localStreamRef.current) return;

    if (camera) {
      localStreamRef.current.getVideoTracks().forEach((track) => track.enabled = false);
      setCamera(false);
    } else {
      localStreamRef.current.getVideoTracks().forEach((track) => track.enabled = true);
      setCamera(true);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL}/turn-credentials`);
        if (res.ok) {
          const data = await res.json();
          if (data?.iceServers) iceServers = data.iceServers;
        }
      } catch (err) {
        console.warn("⚠️ Ошибка при запросе TURN-кредов:", err);
      }

      // Socket.IO
      socketRef.current = io(process.env.NEXT_PUBLIC_SIGNAL_SERVER_URL);
      const socket = socketRef.current;

      // PeerConnection
      pcRef.current = new RTCPeerConnection({ iceServers });
      const pc = pcRef.current;

      // Обработка удалённого потока
      pc.ontrack = (event) => {
        const [ remoteStream ] = event.streams;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
      };

      // ICE кандидаты
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      };

      pc.onconnectionstatechange = () => {
        switch (pc.connectionState) {
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

      // Получаем локальный поток (с фронтальной камерой по умолчанию)
      const stream = await initLocalStream("user");
      if (stream) stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      setPermissionError(null);

      // Socket события
      socket.on("connect", () => socket.emit("join", roomId));

      socket.on("ready", async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, sdp: offer });
      });

      socket.on("offer", async (payload) => {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, sdp: answer });
      });

      socket.on("answer", async (payload) => {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      });

      socket.on("ice-candidate", async (payload) => {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (err) {
          console.error(err);
        }
      });

      return () => {
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
    cameraFacing,
    hasMultipleCameras,
    switchCamera,
    toggleMicro,
    toggleCamera,
    micro,
    camera,
  };
};
