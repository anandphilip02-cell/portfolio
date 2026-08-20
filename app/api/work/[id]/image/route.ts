import { getPortfolioWorkImage } from "../../../../portfolio-work-store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const image = await getPortfolioWorkImage(id);
    if (!image?.body) return new Response(null, { status: 404 });

    return new Response(image.body, {
      headers: {
        "Content-Type": image.httpMetadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
