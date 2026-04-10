const User = require("../models/user");
const {
  formatRejectedDeletionDate,
  getRejectedDeletionDate,
} = require("../utils/rejectedUserPolicy");

/*
 =========================
 GET ALL PENDING USERS
 =========================
*/
exports.getPendingUsers = async (req, res) => {
  try {
    await User.deleteMany({
      isRejected: true,
      rejectionDeleteAt: { $lte: new Date() },
    });

    const users = await User.find({
      isApproved: false,
      isRejected: { $ne: true },
      role: { $ne: "SUPER_ADMIN" }
    }).select("-password");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
 =========================
 APPROVE USER
 =========================
*/
exports.approveUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        isRejected: false,
        rejectedAt: null,
        rejectionDeleteAt: null
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User approved successfully",
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/*
 =========================
 REJECT USER
 =========================
*/
exports.rejectUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const deleteAt = getRejectedDeletionDate();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: false,
        isRejected: true,
        rejectedAt: new Date(),
        rejectionDeleteAt: deleteAt
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User rejected successfully. Account will be deleted on ${formatRejectedDeletionDate(deleteAt)}.`,
      userId: user._id,
      deleteAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
