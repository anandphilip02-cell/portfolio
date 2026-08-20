import { createPortfolioWork, isWorkCategory, listPortfolioWorks } from "../../portfolio-work-store";
import { hasOwnerSession } from "../../owner-session";

export const dynamic = "force-dynamic";

function apiError(error: unknown) {
  return error instanceof Error ? error.message : "Unable to save your work right now.";
}

function formText(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validVideoUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    return Response.json(
      { projects: await listPortfolioWorks() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json({ error: apiError(error) }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await hasOwnerSession(request))) {
    return Response.json({ error: "Owner access is required." }, { status: 401 });
  }

  try {
    const data = await request.formData();
    const title = formText(data, "title");
    const client = formText(data, "client");
    const category = formText(data, "category");
    const copy = formText(data, "copy");
    const videoUrl = validVideoUrl(formText(data, "videoUrl"));
    const photo = data.get("photo");
    const legacyId = formText(data, "legacyId");

    if (!title) return Response.json({ error: "Add a project title." }, { status: 400 });
    if (!isWorkCategory(category)) return Response.json({ error: "Choose SEO, Content, or Video." }, { status: 400 });
    if (!videoUrl) return Response.json({ error: "Paste a valid video link." }, { status: 400 });
    if (!(photo instanceof File) || !photo.size || !photo.type.startsWith("image/")) {
      return Response.json({ error: "Add an image for this work." }, { status: 400 });
    }
    if (photo.size > 5 * 1024 * 1024) {
      return Response.json({ error: "Use an image smaller than 5 MB." }, { status: 400 });
    }

    if (legacyId && !/^work-[a-zA-Z0-9_-]{1,80}$/.test(legacyId)) {
      return Response.json({ error: "This saved project cannot be imported." }, { status: 400 });
    }

    const project = await createPortfolioWork({ category, title, client, copy, videoUrl }, photo, legacyId || undefined);
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    return Response.json({ error: apiError(error) }, { status: 500 });
  }
}
