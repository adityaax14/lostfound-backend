import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import itemRoutes from "./routes/items.route.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// increase limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));

app.use("/items", itemRoutes);

// Only listen when running locally (not in Vercel serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => console.log(`Lost & Found server running on port ${PORT}`));
}

export default app;