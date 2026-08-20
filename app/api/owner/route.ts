import { getOwnerConfig, hasOwnerSession } from "../../owner-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const isConfigured = getOwnerConfig() !== null;
  const isOwner = isConfigured && await hasOwnerSession(request);

  return Response.json(
    { isConfigured, isOwner },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
