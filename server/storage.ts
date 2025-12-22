import { 
  users, products, posters, assets,
  type User, type InsertUser,
  type Product, type InsertProduct,
  type Poster, type InsertPoster,
  type Asset, type InsertAsset
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { chatStorage, type IChatStorage } from "./replit_integrations/chat/storage";

export interface IStorage extends IChatStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(userId: number): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  bulkCreateProducts(products: InsertProduct[]): Promise<Product[]>;

  // Posters
  getPoster(id: number): Promise<Poster | undefined>;
  createPoster(poster: InsertPoster): Promise<Poster>;
  updatePoster(id: number, poster: Partial<InsertPoster>): Promise<Poster>;
  
  // Assets
  getAsset(id: number): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
}

export class DatabaseStorage implements IStorage {
  // Inherit chat storage methods
  getConversation = chatStorage.getConversation;
  getAllConversations = chatStorage.getAllConversations;
  createConversation = chatStorage.createConversation;
  deleteConversation = chatStorage.deleteConversation;
  getMessagesByConversation = chatStorage.getMessagesByConversation;
  createMessage = chatStorage.createMessage;

  // User
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getProducts(userId: number): Promise<Product[]> {
    return db.select().from(products).where(eq(products.userId, userId)).orderBy(desc(products.createdAt));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async bulkCreateProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    if (insertProducts.length === 0) return [];
    return db.insert(products).values(insertProducts).returning();
  }

  // Posters
  async getPoster(id: number): Promise<Poster | undefined> {
    const [poster] = await db.select().from(posters).where(eq(posters.id, id));
    return poster;
  }

  async createPoster(insertPoster: InsertPoster): Promise<Poster> {
    const [poster] = await db.insert(posters).values(insertPoster).returning();
    return poster;
  }

  async updatePoster(id: number, updates: Partial<InsertPoster>): Promise<Poster> {
    const [poster] = await db.update(posters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(posters.id, id))
      .returning();
    return poster;
  }

  // Assets
  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }
}

export const storage = new DatabaseStorage();
