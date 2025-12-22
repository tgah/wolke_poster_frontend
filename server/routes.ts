import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { openai } from "./replit_integrations/image/client";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "wolke_ai_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport config
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "User not found" });
        // In a real app, use scrypt/bcrypt. For v1 demo, simple comparison or pre-seeded check
        if (user.password !== password) return done(null, false, { message: "Incorrect password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Routes
  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Authentication failed" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        // Return token structure as requested by spec
        return res.json({
          access_token: "mock_token_" + user.id,
          token_type: "Bearer",
          user: user
        });
      });
    })(req, res, next);
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });
  
  app.post(api.auth.logout.path, (req, res, next) => {
      req.logout((err) => {
        if (err) return next(err);
        res.json({ message: "Logged out" });
      });
  });

  // Middleware for protected routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // Products Routes
  app.get(api.products.list.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    const products = await storage.getProducts(user.id);
    res.json(products);
  });

  app.post(api.products.import.path, requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    
    try {
      const csvContent = req.file.buffer.toString("utf-8");
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
      
      const user = req.user as any;
      const productsToInsert = records.map((record: any) => ({
        userId: user.id,
        name: record.name || record.Name || "Unnamed Product",
        price: parseFloat(record.price || record.Price || "0").toString(),
        imagePath: record.image_path || record.Image,
      }));

      await storage.bulkCreateProducts(productsToInsert);
      
      res.json({
        processed: records.length,
        succeeded: records.length,
        failed: 0
      });
    } catch (error) {
      console.error("CSV Import Error:", error);
      res.status(500).json({ message: "Failed to parse CSV" });
    }
  });

  // Posters Routes
  app.post(api.posters.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.posters.create.input.parse(req.body);
      const user = req.user as any;
      const poster = await storage.createPoster({ ...input, userId: user.id });
      res.status(201).json(poster);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.posters.get.path, requireAuth, async (req, res) => {
    const poster = await storage.getPoster(Number(req.params.id));
    if (!poster) return res.status(404).json({ message: "Poster not found" });
    res.json(poster);
  });

  app.patch(api.posters.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.posters.update.input.parse(req.body);
      const poster = await storage.updatePoster(Number(req.params.id), input);
      res.json(poster);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post(api.posters.generateBackground.path, requireAuth, async (req, res) => {
    const { themeText } = req.body;
    const posterId = Number(req.params.id);
    const poster = await storage.getPoster(posterId);
    
    if (!poster) return res.status(404).json({ message: "Poster not found" });

    // Update status to generating
    await storage.updatePoster(posterId, { status: "generating" });

    // Async generation
    (async () => {
      try {
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: `A professional marketing poster background for: ${themeText}. Minimalist, clean, suitable for overlaying text.`,
          size: "1024x1024",
          response_format: "b64_json"
        });
        
        const imageData = response.data[0];
        const imageUrl = imageData.url || `data:image/png;base64,${imageData.b64_json}`; // Fallback to data URI if URL not provided
        
        // In a real app, upload this to S3/Blob storage and get a public URL
        // For now, we might save it as a data URI (large!) or just use the temporary URL from OpenAI
        
        await storage.updatePoster(posterId, { 
          status: "completed",
          backgroundImageUrl: imageUrl 
        });
      } catch (error) {
        console.error("Background generation failed:", error);
        await storage.updatePoster(posterId, { status: "draft" }); // Revert status
      }
    })();

    res.json({ message: "Background generation started" });
  });

  app.post(api.posters.export.path, requireAuth, async (req, res) => {
    // Mock export
    res.json({ url: "https://via.placeholder.com/1080x1920?text=Poster+Exported" });
  });

  app.get(api.assets.getUrl.path, requireAuth, async (req, res) => {
    const asset = await storage.getAsset(Number(req.params.id));
    if (!asset) return res.status(404).json({ message: "Asset not found" });
    res.json({ url: asset.url });
  });

  // Register AI routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Seed Data
  if ((await storage.getUserByUsername("admin")) === undefined) {
    await storage.createUser({
      username: "admin",
      password: "password123", // Simple password for v1
      role: "store_owner"
    });
    console.log("Seeded admin user");
  }

  return httpServer;
}
