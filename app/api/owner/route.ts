import { hasOwnerSession } from "../../owner-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isOwner = await hasOwnerSession(request);

  return Response.json(
    { isOwner },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
