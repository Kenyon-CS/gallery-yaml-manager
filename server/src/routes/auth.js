import express from "express";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { DATA_DIR } from "../utils/filePaths.js";

const router = express.Router();

const USERS_FILE = path.join(DATA_DIR, "users.yaml");

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    throw new Error(
      "server/data/users.yaml not found. Copy server/data/users.example.yaml to server/data/users.yaml and add your accounts."
    );
  }
  const file = fs.readFileSync(USERS_FILE, "utf8");
  return yaml.load(file)?.users || [];
}

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  let users;
  try {
    users = loadUsers();
  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ error: error.message });
  }

  const user = users.find(u => u.username === username);

  if (!user || String(user.password) !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    username: user.username,
    role: user.role
  });
});

export default router;
