import { FC } from "react";
import { useRouter } from "next/navigation";
import { ROUTER } from "@/shared/constants";
import st from "./HomePage.module.scss";

export const HomePage: FC = () => {
  const router = useRouter();

  const createRoom = () => {
    const id = Math
      .random()
      .toString(36)
      .substring(2, 9);
    router.push(`${ROUTER.ROOM}/${id}`);
  };

  return (
    <main className={st.main}>
      <h1 className={st.title}>🎥 Мини-видеочат</h1>
      <button
        className={st.btn_creator}
        onClick={createRoom}
      >
        Создать комнату
      </button>
      <p className={st.text}>
        Отправь ссылку другу, чтобы он присоединился к той же комнате.
      </p>
    </main>
  );
};
