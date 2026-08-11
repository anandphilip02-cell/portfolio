import { expiredOwnerSessionCookie } from "../../../owner-session";

export async function POST() {
  return Response.json(
    { isOwner: false },
    { headers: { "Cache-Control": "private, no-store", "Set-Cookie": expiredOwnerSessionCookie() } },
  );
}
