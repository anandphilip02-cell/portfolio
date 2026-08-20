import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const portfolioWorks = sqliteTable(
  "portfolio_works",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    title: text("title").notNull(),
    client: text("client").notNull(),
    year: text("year").notNull(),
    copy: text("copy").notNull(),
    result: text("result").notNull(),
    className: text("class_name").notNull(),
    videoUrl: text("video_url"),
    imageKey: text("image_key"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("idx_portfolio_works_created_at").on(table.createdAt)],
);
