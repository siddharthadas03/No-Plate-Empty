const jwt = require("jsonwebtoken");
const RevokedToken = require("../models/RevokedToken");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const revokedToken = await RevokedToken.findOne({ token });
    if (revokedToken) {
      return res.status(401).json({ message: "Token has been revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
