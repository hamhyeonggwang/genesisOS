import { createClient } from "@/lib/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import { errorResponse } from "@/lib/session-api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: documentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorResponse(401, "UNAUTHENTICATED", "로그인이 필요합니다.");
  }

  const body = await request.json();
  const content = typeof body.content_md === "string" ? body.content_md : null;

  if (!content) {
    return errorResponse(400, "INVALID_INPUT", "content_md는 필수입니다.");
  }

  const { data: lastVersion } = await supabase
    .from(TABLES.documentVersions)
    .select("version")
    .eq("document_id", documentId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle<{ version: number }>();

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from(TABLES.documentVersions)
    .insert({
      user_id: user.id,
      document_id: documentId,
      version: nextVersion,
      content_md: content,
      source: "user_edited",
    })
    .select()
    .single();

  if (error || !inserted) {
    return errorResponse(500, "UPDATE_FAILED", error?.message ?? "저장 실패", true);
  }

  return Response.json({ version: inserted.version, source: inserted.source });
}
