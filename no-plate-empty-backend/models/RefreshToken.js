const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  token: String,
  expiresAt: Date
});

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
