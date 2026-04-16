const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const categoryRoutes = require("./routes/categoryRoutes");
const donorRoutes = require("./routes/DonerRoutes");
const foodRoutes = require("./routes/foodRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ["http://localhost:8080", "http://127.0.0.1:8080"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV === "production") return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/Doner", donorRoutes);
app.use("/api/v1/food", foodRoutes);

if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(
    __dirname,
    "..",
    "no-plate-empty-main",
    "Frontend",
    "dist"
  );

  app.use(express.static(clientBuildPath));

  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ message: "API route not found" });
    }

    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

module.exports = app;
