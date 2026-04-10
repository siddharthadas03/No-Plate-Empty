const mongoose = require("mongoose");
const {
  geoPointSchema,
  locationDetailsSchema,
  syncGeoFromLocation,
} = require("../utils/location");

const DonerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a title for this doner"],
    },
    imageUrl: {
      type: String,
    },
    food: {
      type: Array,
    },
    time: {
      type: String,
    },
    pickup: {
      type: Boolean,
      default: true,
    },
    delivery: {
      type: Boolean,
      default: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    location: locationDetailsSchema,
    geo: {
      type: geoPointSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

DonerSchema.index({ geo: "2dsphere" });

DonerSchema.pre("validate", function syncOutletGeo() {
  syncGeoFromLocation(this);
});

module.exports = mongoose.model("Doner", DonerSchema);
