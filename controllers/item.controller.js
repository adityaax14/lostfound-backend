import { supabase } from "../supabase.js";

const CATEGORIES = ["phone", "keys", "wallet", "laptop", "id_card", "airpods", "bag", "other"];
const TYPES      = ["lost", "found"];

// ── GET ALL ACTIVE ITEMS ──────────────────────────────────────────────────────
export const getItems = async (req, res) => {
  try {
    const { type, category } = req.query;
    const now = new Date().toISOString();

    let query = supabase
      .from("items")
      .select("*")
      .eq("status", "active")
      .gt("expires_at", now)          // only non-expired
      .order("created_at", { ascending: false }); // newest first

    if (type     && TYPES.includes(type))           query = query.eq("type", type);
    if (category && CATEGORIES.includes(category))  query = query.eq("category", category);

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── GET SINGLE ITEM ───────────────────────────────────────────────────────────
export const getItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Item not found" });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── CREATE ITEM ───────────────────────────────────────────────────────────────
// image is uploaded to Supabase Storage from the frontend directly
// backend just stores the public URL
export const createItem = async (req, res) => {
  try {
    const { type, category, description, image_url, contact_phone, note } = req.body;

    // validate required fields
    if (!type || !category || !description || !image_url || !contact_phone) {
      return res.status(400).json({ error: "All fields except note are required" });
    }

    if (!TYPES.includes(type)) {
      return res.status(400).json({ error: "Type must be lost or found" });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    if (!/^\d{10}$/.test(contact_phone)) {
      return res.status(400).json({ error: "Enter a valid 10-digit WhatsApp number" });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ error: "Description must be at least 10 characters" });
    }

    const { data, error } = await supabase
      .from("items")
      .insert({
        type,
        category,
        description: description.trim(),
        image_url,
        contact_phone,
        note: note?.trim() || null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ message: "Posted successfully", item: data });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── MARK AS RESOLVED ──────────────────────────────────────────────────────────
export const resolveItem = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from("items")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: "Item not found" });
    }

    if (existing.status === "resolved") {
      return res.status(400).json({ error: "Item is already resolved" });
    }

    const { error } = await supabase
      .from("items")
      .update({ status: "resolved" })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Marked as resolved" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};