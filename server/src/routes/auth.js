import express from "express";
import fs from "fs";
import yaml from "js-yaml";

const router = express.Router();

const USERS_FILE = "data/users.yaml";

function loadUsers() {
  const file = fs.readFileSync(USERS_FILE, "utf8");
  return yaml.load(file).users;
}

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const users = loadUsers();
  const user = users.find(u => u.username === username);

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({
    username: user.username,
    role: user.role
  });
});

export default router;