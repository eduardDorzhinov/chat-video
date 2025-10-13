import { FC } from "react";
import { VideoChat } from "@/ui/components/video-chat/VideoChat";
import st from "./RoomPage.module.scss";

type Props = { roomId: string };

export const RoomPage: FC<Props> = ({ roomId }) => {
  return (
    <main className={st.main}>
      <VideoChat roomId={roomId} />
    </main>
  );
};
