import db from "../config/db.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (file) => {
  const key = `uploads/${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    })
  );

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};

const normalizeImages = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON array
    }
    return value.trim() ? [value] : [];
  }

  return [];
};

export const getProducts = async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM products ORDER BY id DESC");
  const result = rows.map((row) => {
    const images = normalizeImages(row.image_url);
    return {
      ...row,
      image_url: images[0] || null,
      images,
    };
  });

  res.json(result);
};

export const createProduct = async (req, res) => {
  try {
    const { title, caption, price } = req.body;

    const files = req.files || [];
    let imageUrls = [];

    if (files.length) {
      imageUrls = await Promise.all(files.map(uploadToS3));
    }

    await db.execute(
      "INSERT INTO products (title, caption, price, image_url) VALUES (?,?,?,?)",
      [title, caption, price, JSON.stringify(imageUrls)]
    );

    res.json({ msg: "Product created", images: imageUrls });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { title, caption, price } = req.body;
    const { id } = req.params;

    // Ambil gambar lama dari DB
    const [existingRows] = await db.execute(
      "SELECT image_url FROM products WHERE id=?",
      [id]
    );
    const existingImages = normalizeImages(existingRows?.[0]?.image_url);

    // Cek jika client mengirim daftar gambar lama (misal saat tidak upload baru)
    const payloadImages = normalizeImages(req.body.existingImages);

    let imageUrls = payloadImages.length ? payloadImages : existingImages;

    // Jika upload image baru
    if (req.files && req.files.length) {
      imageUrls = await Promise.all(req.files.map(uploadToS3));
    }

    await db.execute(
      "UPDATE products SET title=?, caption=?, price=?, image_url=? WHERE id=?",
      [title, caption, price, JSON.stringify(imageUrls), id]
    );

    res.json({ msg: "Product updated", images: imageUrls });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute("DELETE FROM products WHERE id=?", [id]);

    res.json({ msg: "Product deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
