const mongoose = require("mongoose");
const {
  geoPointSchema,
  locationDetailsSchema,
  syncGeoFromLocation,
} = require("../utils/location");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: {
    type: String,
    unique: true,
    required: true
  },

  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["SUPER_ADMIN", "DONOR", "NGO"],
    required: true
  },

  isApproved: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  rejectedAt: { type: Date, default: null },
  rejectionDeleteAt: { type: Date, default: null },
  location: {
    type: locationDetailsSchema,
    default: undefined
  },
  geo: {
    type: geoPointSchema,
    default: undefined
  },
  searchRadiusKm: {
    type: Number,
    min: 1,
    max: 100,
    default: 10
  }

}, { timestamps: true });

userSchema.index({ geo: "2dsphere" });

userSchema.pre("validate", function syncUserGeo() {
  syncGeoFromLocation(this);
});

module.exports = mongoose.model("User", userSchema);
