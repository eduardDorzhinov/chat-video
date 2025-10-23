"use client";

import {
  FC,
  useEffect,
  useRef,
  useState,
} from "react";
import st from "./VideoChat.module.scss";
import { useRouter } from "next/navigation";
import { ROUTER } from "@/shared/constants";
import clsx from "clsx";
import { useConnection } from "@/shared/hooks/use-connection";
import { CAMERA_MODE, HIDE_CONTROLS_MS } from "@/ui/pages/room/config";

type Props = { roomId: string };

export const VideoChat: FC<Props> = ({ roomId }) => {
  const router = useRouter();

  const {
    localVideoRef,
    remoteVideoRef,
    pcRef,
    localStreamRef: _localStreamRef,
    socketRef,
    connectionState: _connectionState,
    permissionError,
    cameraFacing,
    hasMultipleCameras,
    switchCamera,
    toggleMicro,
    toggleCamera,
    micro,
    camera,
  } = useConnection({ roomId });

  const [ showControls, setShowControls ] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const leaveRoom = () => {
    pcRef.current?.close();
    socketRef.current?.disconnect();
    router.push(ROUTER.HOME);
  };

  const inviteOnClick = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  const toggleControls = () => {
    if (showControls) return;
    setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowControls(false), HIDE_CONTROLS_MS);
  };

  const showControlsAction = () => {
    if (!showControls) setShowControls(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShowControls(false), HIDE_CONTROLS_MS);
  };

  useEffect(() => {
    timeoutRef.current = setTimeout(() => setShowControls(false), HIDE_CONTROLS_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={st.videoWrapper}
      onClick={toggleControls}
      onMouseMove={showControlsAction}
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
        className={
          clsx(
            st.video,
            st.localVideo,
            cameraFacing === CAMERA_MODE.USER && st.mirror,
          )
        }
      />

      <div className={st.overlay}>
        {
          showControls && (
            <div className={st.controls_overlay}>
              <button onClick={inviteOnClick}>
                {"➕👤"}
              </button>
              <button onClick={toggleMicro}>
                {micro ? "🎤" : "🔇"}
              </button>
              <button onClick={toggleCamera}>
                {camera ? "📷✅" : "📷🚫"}
              </button>
              {
                hasMultipleCameras && (
                  <button onClick={switchCamera}>
                    📷🔄
                  </button>
                )
              }
              <button
                className={st.hangup}
                onClick={leaveRoom}
              >
                ❌
              </button>
            </div>
          )
        }

        <div className={st.status_overlay}>
          {
            permissionError ? (
              <span className={st.status_text}>нет доступа к камере и микрофону</span>
            ) : !micro && !camera ? (
              <span className={st.status_text}>камера и микрофон выключены</span>
            ) : !camera ? (
              <span className={st.status_text}>камера выключена</span>
            ) : !micro ? (
              <span className={st.status_text}>микрофон выключен</span>
            ) : null
          }
        </div>
      </div>
    </div>
  );
};
