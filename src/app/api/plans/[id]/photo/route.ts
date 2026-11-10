import { getPlanPhoto } from "@/lib/server/db";

/** Serves the item photo as an image so plan polling stays small. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dataUrl = await getPlanPhoto(id);
  const match = dataUrl?.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (!match) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(match[2], "base64"), {
    headers: { "content-type": match[1], "cache-control": "public, max-age=86400, immutable" },
  });
}
