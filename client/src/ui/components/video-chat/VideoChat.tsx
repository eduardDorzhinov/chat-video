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
    remoteConnected,
  } = useConnection({ roomId });

  const [ showControls, setShowControls ] = useState(true);
  const [ isLocalVideoMain, setIsLocalVideoMain ] = useState(!remoteConnected);

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

  useEffect(() => {
    if (remoteConnected) setIsLocalVideoMain(false);
  }, [ remoteConnected ]);

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
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={
          clsx(
            st.video,
            cameraFacing === CAMERA_MODE.USER && st.mirror,
            isLocalVideoMain ? st.main_video : st.small_video,
            showControls && st.enlarged,
          )
        }
      />

      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={
          clsx(
            st.video,
            !isLocalVideoMain ? st.main_video : st.small_video,
            !remoteConnected && st.hide,
            showControls && st.enlarged,
          )
        }
      />

      {
        remoteConnected && (
          <button
            className={clsx(st.switch_btn, showControls ? st.show_btn : st.hide_btn)}
            onClick={
              (e) => {
                e.stopPropagation();
                setIsLocalVideoMain((p) => !p);
              }
            }
          >
            ↖️
          </button>
        )
      }

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
