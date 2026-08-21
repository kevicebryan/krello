import { notFound } from "next/navigation";
import { BoardView } from "@/components/boards/BoardView";
import { getBoardDetail } from "@/lib/boards/queries";
import { createClient } from "@/lib/supabase/server";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  const supabase = await createClient();
  const board = await getBoardDetail(supabase, boardId);

  if (!board) {
    notFound();
  }

  return <BoardView boardId={boardId} initialData={board} />;
}
