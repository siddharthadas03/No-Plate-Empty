const mongoose = require("mongoose");

const pickDefined = (values) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
};

const locationDetailsSchema = new mongoose.Schema(
  {
    id: { type: String, trim: true },
    title: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    latitude: { type: Number, min: -90, max: 90 },
    latitudeDelta: { type: Number, min: 0 },
    longitude: { type: Number, min: -180, max: 180 },
    longitudeDelta: { type: Number, min: 0 },
  },
  { _id: false }
);

const geoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: undefined,
      validate: {
        validator(value) {
          return (
            value === undefined ||
            (Array.isArray(value) &&
              value.length === 2 &&
              value.every(
                (coordinate) =>
                  typeof coordinate === "number" && Number.isFinite(coordinate)
              ))
          );
        },
        message: "Geo coordinates must contain [longitude, latitude]",
      },
    },
  },
  { _id: false }
);

const normalizeLocationInput = (location) => {
  if (!location || typeof location !== "object") {
    return undefined;
  }

  const normalized = pickDefined({
    id: normalizeOptionalString(location.id),
    title: normalizeOptionalString(location.title),
    address: normalizeOptionalString(location.address),
    city: normalizeOptionalString(location.city),
    state: normalizeOptionalString(location.state),
    pincode: normalizeOptionalString(location.pincode),
    latitude: normalizeOptionalNumber(location.latitude),
    latitudeDelta: normalizeOptionalNumber(location.latitudeDelta),
    longitude: normalizeOptionalNumber(location.longitude),
    longitudeDelta: normalizeOptionalNumber(location.longitudeDelta),
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const buildGeoPointFromLocation = (location) => {
  const normalizedLocation = normalizeLocationInput(location);

  if (!normalizedLocation) {
    return undefined;
  }

  const { latitude, longitude } = normalizedLocation;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }

  return {
    type: "Point",
    coordinates: [longitude, latitude],
  };
};

const syncGeoFromLocation = (
  document,
  { locationField = "location", geoField = "geo" } = {}
) => {
  const normalizedLocation = normalizeLocationInput(document[locationField]);
  document[locationField] = normalizedLocation;
  document[geoField] = buildGeoPointFromLocation(normalizedLocation);
};

module.exports = {
  buildGeoPointFromLocation,
  geoPointSchema,
  locationDetailsSchema,
  normalizeLocationInput,
  syncGeoFromLocation,
};
