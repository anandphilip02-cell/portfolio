import { env } from "cloudflare:workers";

export type WorkCategory = "SEO" | "Content" | "Video";

export type PortfolioWork = {
  id: string;
  category: WorkCategory;
  title: string;
  client: string;
  year: string;
  copy: string;
  result: string;
  className: string;
  image?: string;
  videoUrl?: string;
  isDraft?: boolean;
};

type StoredWork = {
  id: string;
  category: WorkCategory;
  title: string;
  client: string;
  year: string;
  copy: string;
  result: string;
  class_name: string;
  video_url: string | null;
  image_key: string | null;
  created_at: string;
  updated_at: string;
};

type PortfolioBindings = {
  DB: D1Database;
  PORTFOLIO_MEDIA: R2Bucket;
};

type WorkDetails = Pick<PortfolioWork, "category" | "title" | "client" | "copy" | "videoUrl">;

const seededWorks: Array<Omit<StoredWork, "image_key">> = [
  {
    id: "dental-content-strategy",
    category: "SEO",
    title: "Dental anxiety content strategy",
    client: "Consed International",
    year: "2025 - present",
    copy: "Search-led patient education content for a specialist dental audience.",
    result: "Content + intent alignment",
    class_name: "project-dental",
    video_url: null,
    created_at: "2025-01-03T00:00:00.000Z",
    updated_at: "2025-01-03T00:00:00.000Z",
  },
  {
    id: "sedation-machine-seo",
    category: "SEO",
    title: "Conscious sedation machine",
    client: "Consed International",
    year: "SEO showcase",
    copy: "On-page SEO work around a high-intent product keyword.",
    result: "Ranked 1st for target keyword",
    class_name: "project-sedation",
    video_url: null,
    created_at: "2025-01-02T00:00:00.000Z",
    updated_at: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "seo-extensions-resource",
    category: "Content",
    title: "20 essential SEO extensions",
    client: "Naza Enterprises",
    year: "2022 - 2023",
    copy: "Educational resource designed to make practical SEO tooling accessible.",
    result: "Evergreen SEO education",
    class_name: "project-tools",
    video_url: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
  },
];

let schemaInitialization: Promise<void> | undefined;

function bindings() {
  return env as unknown as PortfolioBindings;
}

function database() {
  const db = bindings().DB;
  if (!db) throw new Error("Portfolio storage is unavailable.");
  return db;
}

function mediaBucket() {
  const bucket = bindings().PORTFOLIO_MEDIA;
  if (!bucket) throw new Error("Portfolio media storage is unavailable.");
  return bucket;
}

async function ensureSchema() {
  if (!schemaInitialization) {
    const db = database();
    schemaInitialization = db
      .batch([
        db.prepare(
          `CREATE TABLE IF NOT EXISTS portfolio_works (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            client TEXT NOT NULL,
            year TEXT NOT NULL,
            copy TEXT NOT NULL,
            result TEXT NOT NULL,
            class_name TEXT NOT NULL,
            video_url TEXT,
            image_key TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )`,
        ),
        db.prepare("CREATE INDEX IF NOT EXISTS idx_portfolio_works_created_at ON portfolio_works(created_at)"),
        ...seededWorks.map((work) =>
          db
            .prepare(
              `INSERT OR IGNORE INTO portfolio_works
                (id, category, title, client, year, copy, result, class_name, video_url, image_key, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
            )
            .bind(
              work.id,
              work.category,
              work.title,
              work.client,
              work.year,
              work.copy,
              work.result,
              work.class_name,
              work.video_url,
              work.created_at,
              work.updated_at,
            ),
        ),
      ])
      .then(() => undefined);
  }

  return schemaInitialization;
}

function toPortfolioWork(work: StoredWork): PortfolioWork {
  return {
    id: work.id,
    category: work.category,
    title: work.title,
    client: work.client,
    year: work.year,
    copy: work.copy,
    result: work.result,
    className: work.class_name,
    image: work.image_key ? `/api/work/${encodeURIComponent(work.id)}/image` : undefined,
    videoUrl: work.video_url || undefined,
    isDraft: true,
  };
}

async function findStoredWork(id: string) {
  await ensureSchema();
  const record = await database()
    .prepare(
      `SELECT id, category, title, client, year, copy, result, class_name, video_url, image_key, created_at, updated_at
       FROM portfolio_works WHERE id = ?`,
    )
    .bind(id)
    .first<StoredWork>();

  return record ?? null;
}

async function storePhoto(id: string, photo: File) {
  const key = `portfolio-work/${id}/${crypto.randomUUID()}`;
  await mediaBucket().put(key, await photo.arrayBuffer(), {
    httpMetadata: { contentType: photo.type || "image/jpeg" },
  });
  return key;
}

export function isWorkCategory(value: string): value is WorkCategory {
  return value === "SEO" || value === "Content" || value === "Video";
}

export async function listPortfolioWorks() {
  await ensureSchema();
  const result = await database()
    .prepare(
      `SELECT id, category, title, client, year, copy, result, class_name, video_url, image_key, created_at, updated_at
       FROM portfolio_works
       ORDER BY created_at DESC, id DESC`,
    )
    .all<StoredWork>();

  return result.results.map(toPortfolioWork);
}

export async function createPortfolioWork(details: WorkDetails, photo: File) {
  await ensureSchema();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const imageKey = await storePhoto(id, photo);

  try {
    await database()
      .prepare(
        `INSERT INTO portfolio_works
          (id, category, title, client, year, copy, result, class_name, video_url, image_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        details.category,
        details.title,
        details.client || "Personal work",
        "Portfolio work",
        details.copy || "A portfolio project with an edited video.",
        "Video link added",
        "project-uploaded",
        details.videoUrl || null,
        imageKey,
        now,
        now,
      )
      .run();
  } catch (error) {
    await mediaBucket().delete(imageKey);
    throw error;
  }

  const work = await findStoredWork(id);
  if (!work) throw new Error("The work could not be saved.");
  return toPortfolioWork(work);
}

export async function updatePortfolioWork(id: string, details: WorkDetails, photo?: File) {
  const existing = await findStoredWork(id);
  if (!existing) return null;

  const newImageKey = photo ? await storePhoto(id, photo) : existing.image_key;
  const updatedAt = new Date().toISOString();

  try {
    await database()
      .prepare(
        `UPDATE portfolio_works
         SET category = ?, title = ?, client = ?, copy = ?, video_url = ?, image_key = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        details.category,
        details.title,
        details.client || "Personal work",
        details.copy || "A portfolio project with an edited video.",
        details.videoUrl || null,
        newImageKey,
        updatedAt,
        id,
      )
      .run();
  } catch (error) {
    if (photo && newImageKey) await mediaBucket().delete(newImageKey);
    throw error;
  }

  if (photo && existing.image_key) await mediaBucket().delete(existing.image_key);

  const work = await findStoredWork(id);
  return work ? toPortfolioWork(work) : null;
}

export async function deletePortfolioWork(id: string) {
  const existing = await findStoredWork(id);
  if (!existing) return false;

  await database().prepare("DELETE FROM portfolio_works WHERE id = ?").bind(id).run();
  if (existing.image_key) await mediaBucket().delete(existing.image_key);
  return true;
}

export async function getPortfolioWorkImage(id: string) {
  const existing = await findStoredWork(id);
  if (!existing?.image_key) return null;
  return mediaBucket().get(existing.image_key);
}
