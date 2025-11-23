import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    await db.execute(
      "INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)",
      [name, email, hashed, role]
    );

    res.json({ msg: "Register success" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email=?",
      [email]
    );

    if (!rows.length) return res.status(400).json({ msg: "Email not found" });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong password" });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const [rows] = await db.execute(
      "SELECT id, name, email, role FROM users WHERE id=?",
      [id]
    );

    if (!rows.length) return res.status(404).json({ msg: "User not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name, email, password } = req.body;

    const [rows] = await db.execute(
      "SELECT id, role, name, email, password AS hashed FROM users WHERE id=?",
      [id]
    );

    if (!rows.length) return res.status(404).json({ msg: "User not found" });
    const current = rows[0];

    const newName = name ?? current.name;
    const newEmail = email ?? current.email;

    let newPasswordHash = current.hashed;
    if (password) {
      newPasswordHash = await bcrypt.hash(password, 10);
    }

    await db.execute(
      "UPDATE users SET name=?, email=?, password=? WHERE id=?",
      [newName, newEmail, newPasswordHash, id]
    );

    const token = jwt.sign(
      { id, role: current.role, name: newName, email: newEmail },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({
      msg: "Profile updated",
      token,
      user: { id, name: newName, email: newEmail, role: current.role },
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
