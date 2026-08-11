import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";

const ownerEmails = new Set(
  (process.env.PORTFOLIO_OWNER_EMAILS ?? "ronak20039@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export async function GET() {
  const user = await getChatGPTUser();
  const isOwner = Boolean(user && ownerEmails.has(user.email.toLowerCase()));

  return Response.json(
    { isOwner },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
