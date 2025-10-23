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
import {
  CAMERA_MODE,
  HIDE_CONTROLS_MS,
} from "@/ui/pages/room/config";

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
  const [ isLocalVideoMain, setIsLocalVideoMain ] = useState(true);

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


  const description = (() => {
    if (permissionError) return "нет доступа к камере и микрофону";
    if (!micro && !camera) return "камера и микрофон выключены";
    if (!camera) return "камера выключена";
    if (!micro) return "микрофон выключен";
    return null;
  })();

  return (
    <div
      className={st.wrap}
      onClick={
        () => {
          if (showControls) return;
          toggleControls();
        }
      }
      onMouseMove={showControlsAction}
    >
      <video
        ref={isLocalVideoMain ? localVideoRef : remoteVideoRef}
        autoPlay
        playsInline
        className={
          clsx(
            st.video,
            st.main_video,
            isLocalVideoMain && cameraFacing === CAMERA_MODE.USER && st.mirror,
          )
        }
        muted={isLocalVideoMain}
      />

      <div className={clsx(st.small_video_wrap, showControls && st.enlarged)}>
        <video
          ref={isLocalVideoMain ? remoteVideoRef : localVideoRef}
          autoPlay
          playsInline
          className={
            clsx(
              st.video,
              st.small_video,
              !isLocalVideoMain && cameraFacing === CAMERA_MODE.USER && st.mirror,
            )
          }
          muted={!isLocalVideoMain}
        />
        {
          showControls && (
            <button
              className={st.switch_btn}
              onClick={
                (e) => {
                  e.stopPropagation();
                  setIsLocalVideoMain((p) => !p);
                }
              }
            >
              🔁
            </button>
          )
        }
      </div>

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
            description && (
              <span className={st.status_text}>{description}</span>
            )
          }
        </div>
      </div>
    </div>
  );
};
