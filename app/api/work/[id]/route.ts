import { deletePortfolioWork, isWorkCategory, updatePortfolioWork } from "../../../portfolio-work-store";
import { hasOwnerSession } from "../../../owner-session";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

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

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await hasOwnerSession(request))) {
    return Response.json({ error: "Owner access is required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const data = await request.formData();
    const title = formText(data, "title");
    const client = formText(data, "client");
    const category = formText(data, "category");
    const copy = formText(data, "copy");
    const videoUrl = validVideoUrl(formText(data, "videoUrl"));
    const photo = data.get("photo");

    if (!title) return Response.json({ error: "Add a project title." }, { status: 400 });
    if (!isWorkCategory(category)) return Response.json({ error: "Choose SEO, Content, or Video." }, { status: 400 });
    if (!videoUrl) return Response.json({ error: "Paste a valid video link." }, { status: 400 });
    if (photo instanceof File && photo.size && (!photo.type.startsWith("image/") || photo.size > 5 * 1024 * 1024)) {
      return Response.json({ error: "Use an image smaller than 5 MB." }, { status: 400 });
    }

    const project = await updatePortfolioWork(
      id,
      { category, title, client, copy, videoUrl },
      photo instanceof File && photo.size ? photo : undefined,
    );

    if (!project) return Response.json({ error: "This project no longer exists." }, { status: 404 });
    return Response.json({ project });
  } catch {
    return Response.json({ error: "Unable to save your work right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await hasOwnerSession(request))) {
    return Response.json({ error: "Owner access is required." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const deleted = await deletePortfolioWork(id);
    if (!deleted) return Response.json({ error: "This project no longer exists." }, { status: 404 });
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "Unable to delete this work right now." }, { status: 500 });
  }
}
