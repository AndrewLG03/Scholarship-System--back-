const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const comiteRoutes = require("./comite.routes");

// Rutas principales
router.use("/auth", authRoutes);
router.use("/comite", comiteRoutes);

// Health check
router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = router;
