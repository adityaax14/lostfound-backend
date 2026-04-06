import { supabase } from "../supabase.js";
import { v4 as uuidv4 } from "uuid";

const BUCKET      = "lost-and-found";
const MAX_SIZE_MB  = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

// ── UPLOAD IMAGE ──────────────────────────────────────────────────────────────
// receives base64 image from frontend, uploads to Supabase Storage
// returns the public URL to store in the items table
export const uploadImage = async (req, res) => {
  try {
    const { base64, fileName } = req.body;
    let { mimeType } = req.body;

    if (!base64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    // Camera captures on some mobile browsers send empty mimeType — default to jpeg
    if (!mimeType || mimeType.trim() === "") {
      mimeType = "image/jpeg";
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return res.status(400).json({ error: "Only JPEG, PNG, WebP and HEIC images allowed" });
    }

    // convert base64 to buffer
    const buffer = Buffer.from(base64, "base64");

    // check file size
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > MAX_SIZE_MB) {
      return res.status(400).json({ error: `Image must be under ${MAX_SIZE_MB}MB` });
    }

    // generate unique filename
    const ext      = mimeType.split("/")[1].replace("jpeg", "jpg");
    const uniqueName = `${uuidv4()}.${ext}`;

    // upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) return res.status(400).json({ error: uploadError.message });

    // get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(uniqueName);

    res.json({ url: urlData.publicUrl });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};