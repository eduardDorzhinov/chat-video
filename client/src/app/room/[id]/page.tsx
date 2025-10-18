import { RoomPage } from "@/ui/pages/room/RoomPage";

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <RoomPage roomId={id} />
  );
}
