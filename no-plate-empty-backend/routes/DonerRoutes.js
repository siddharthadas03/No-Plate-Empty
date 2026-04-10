const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const {
  createDonerController,
  getCurrentDonerController,
  getMyDonersController,
  getAllDonersController,
  getNearbyDonersController,
  getSingleDonerController,
  updateDonerController,
  deleteDonerController,
} = require("../controllers/DonerController");

const router = express.Router();

// routes
router.post("/create", authMiddleware, createDonerController);
router.get("/me", authMiddleware, getCurrentDonerController);
router.get("/my-records", authMiddleware, getMyDonersController);
router.get("/nearby", authMiddleware, getNearbyDonersController);
//get all Doners
router.get("/get-all-Doners", getAllDonersController);
//get single Doner by id
router.get("/get/:id", getSingleDonerController);
router.put("/update/:id", authMiddleware, updateDonerController);

//Delete Doner by id
router.delete("/delete/:id", authMiddleware, deleteDonerController);  





module.exports = router;
