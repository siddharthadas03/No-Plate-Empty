const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const {
  createFoodController,
  getAllFoodsController,
  getNearbyFoodsController,
  getSingleFoodController,
  getFoodByDonerController,
  getMyFoodsController,
  updateFoodController,
  deleteFoodController,
  placeOrderController,
  getNgoOrdersController,
  getDonorOrdersController,
  updateOrderStatusController,
} = require("../controllers/foodController");

const router = express.Router();

// routes
router.post("/create", authMiddleware, createFoodController);
// get all foods
router.get("/get-all-food", getAllFoodsController);
router.get("/nearby", authMiddleware, getNearbyFoodsController);
// get single food by id
router.get("/get/:id", getSingleFoodController);
// get food by doner
router.get("/get-by-doner/:donerId", getFoodByDonerController);
router.get("/my-foods", authMiddleware, getMyFoodsController);
// update food
router.put("/update/:id", authMiddleware, updateFoodController);
//delete food
router.put("/delete/:id", authMiddleware, deleteFoodController);



//place order
router.post("/place-order", authMiddleware,
placeOrderController);
router.get("/my-orders", authMiddleware, getNgoOrdersController);
router.get("/donor-orders", authMiddleware, getDonorOrdersController);
router.patch("/order-status/:orderId", authMiddleware, updateOrderStatusController);

module.exports = router;
