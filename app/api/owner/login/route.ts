import {
  createOwnerSession,
  credentialsMatch,
  getOwnerConfig,
  ownerSessionCookie,
} from "../../../owner-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getOwnerConfig();
  if (!config) {
    return Response.json({ error: "Owner login is not configured." }, { status: 503 });
  }

  let credentials: { username?: unknown; password?: unknown };
  try {
    credentials = await request.json();
  } catch {
    return Response.json({ error: "Enter your username and password." }, { status: 400 });
  }

  const username = typeof credentials.username === "string" ? credentials.username : "";
  const password = typeof credentials.password === "string" ? credentials.password : "";
  const isOwner = await credentialsMatch(username, password, config);

  if (!isOwner) {
    return Response.json({ error: "That username or password is incorrect." }, { status: 401 });
  }

  const session = await createOwnerSession(config);
  return Response.json(
    { isOwner: true },
    { headers: { "Cache-Control": "private, no-store", "Set-Cookie": ownerSessionCookie(session) } },
  );
}
