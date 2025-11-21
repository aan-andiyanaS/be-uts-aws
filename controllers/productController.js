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

export const getProducts = async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM products ORDER BY id DESC");
  res.json(rows);
};

export const createProduct = async (req, res) => {
  try {
    const { title, caption, price } = req.body;

    let imageUrl = null;

    if (req.file) {
      const key = `uploads/${Date.now()}-${req.file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      );

      imageUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    }

    await db.execute(
      "INSERT INTO products (title, caption, price, image_url) VALUES (?,?,?,?)",
      [title, caption, price, imageUrl]
    );

    res.json({ msg: "Product created" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { title, caption, price } = req.body;
    const { id } = req.params;

    let imageUrl = req.body.image_url || null;

    // Jika upload image baru
    if (req.file) {
      const key = `uploads/${Date.now()}-${req.file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          ACL: "public-read",
        })
      );

      imageUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
    }

    await db.execute(
      "UPDATE products SET title=?, caption=?, price=?, image_url=? WHERE id=?",
      [title, caption, price, imageUrl, id]
    );

    res.json({ msg: "Product updated" });
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
