import express from "express";
import { getItems, getItem, createItem, resolveItem } from "../controllers/item.controller.js";
import { uploadImage } from "../controllers/upload.controller.js";

const router = express.Router();

// items
router.get("/",              getItems);         // GET  /items
router.get("/:id",           getItem);          // GET  /items/:id
router.post("/",             createItem);       // POST /items
router.patch("/:id/resolve", resolveItem);      // PATCH /items/:id/resolve

// image upload
router.post("/upload",       uploadImage);      // POST /items/upload

export default router;