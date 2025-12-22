import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("store_owner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key to users
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imagePath: text("image_path"),
  slotIndex: integer("slot_index"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Posters
export const posters = pgTable("posters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  templateKey: text("template_key").notNull(), // '2_products' or '3_products'
  saleTitle: text("sale_title").notNull(),
  themeText: text("theme_text").notNull(),
  status: text("status").default("draft").notNull(), // draft, generating, completed
  backgroundImageUrl: text("background_image_url"),
  storeLogoUrl: text("store_logo_url"),
  disclaimer: text("disclaimer"),
  dates: text("dates"),
  productIds: jsonb("product_ids").$type<number[]>().notNull(), // Array of product IDs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Assets (for uploaded images, logos, etc.)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'background', 'logo', 'product'
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertPosterSchema = createInsertSchema(posters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAssetSchema = createInsertSchema(assets).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Poster = typeof posters.$inferSelect;
export type InsertPoster = z.infer<typeof insertPosterSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

// API Request Types
export type CreatePosterRequest = InsertPoster;
export type UpdatePosterRequest = Partial<InsertPoster>;
export type GenerateBackgroundRequest = { themeText: string };
export type ImportProductsResponse = { processed: number; succeeded: number; failed: number };
