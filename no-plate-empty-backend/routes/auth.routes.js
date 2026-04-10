const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");

const {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  resetPassword,
  logout,
  deleteCurrentUser
} = require("../controllers/auth.controller");

// REGISTER
router.post("/register", register);

// LOGIN
router.post("/login", login);

// CURRENT USER
router.get("/me", auth, getCurrentUser);
router.patch("/me", auth, updateCurrentUser);
router.patch("/reset-password", auth, resetPassword);
router.post("/logout", auth, logout);
router.delete("/me", auth, deleteCurrentUser);

module.exports = router;
