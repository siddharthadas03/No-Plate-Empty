const DonerModel = require("../models/DonerModel");
const { buildGeoPointFromLocation, normalizeLocationInput } = require("./location");

const DEFAULT_RADIUS_KM = 10;
const MAX_RADIUS_KM = 100;
const EARTH_RADIUS_KM = 6371;

const sortLatestFirst = {
  updatedAt: -1,
  createdAt: -1,
};

const normalizeText = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildExactRegex = (value) => new RegExp(`^${escapeRegExp(value)}$`, "i");

const clampRadiusKm = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_RADIUS_KM;
  }

  return Math.min(Math.max(numericValue, 1), MAX_RADIUS_KM);
};

const buildFallbackMatcher = (location) => {
  const normalizedLocation = normalizeLocationInput(location);
  const pincode = normalizeText(normalizedLocation?.pincode);
  const city = normalizeText(normalizedLocation?.city);
  const state = normalizeText(normalizedLocation?.state);

  if (pincode) {
    return {
      mode: "pincode",
      query: {
        "location.pincode": buildExactRegex(pincode),
      },
      summary: `matching donor outlets in pincode ${pincode}.`,
      matches(outletLocation) {
        return normalizeText(outletLocation?.pincode)?.toLowerCase() === pincode.toLowerCase();
      },
    };
  }

  if (city && state) {
    return {
      mode: "city_state",
      query: {
        "location.city": buildExactRegex(city),
        "location.state": buildExactRegex(state),
      },
      summary: `matching donor outlets in ${city}, ${state}.`,
      matches(outletLocation) {
        return (
          normalizeText(outletLocation?.city)?.toLowerCase() === city.toLowerCase() &&
          normalizeText(outletLocation?.state)?.toLowerCase() === state.toLowerCase()
        );
      },
    };
  }

  if (city) {
    return {
      mode: "city",
      query: {
        "location.city": buildExactRegex(city),
      },
      summary: `matching donor outlets in ${city}.`,
      matches(outletLocation) {
        return normalizeText(outletLocation?.city)?.toLowerCase() === city.toLowerCase();
      },
    };
  }

  if (state) {
    return {
      mode: "state",
      query: {
        "location.state": buildExactRegex(state),
      },
      summary: `matching donor outlets in ${state}.`,
      matches(outletLocation) {
        return normalizeText(outletLocation?.state)?.toLowerCase() === state.toLowerCase();
      },
    };
  }

  return null;
};

const buildNgoMatchPlan = (user) => {
  const location = normalizeLocationInput(user?.location);
  const fallbackMatcher = buildFallbackMatcher(location);
  const geo =
    (user?.geo?.type === "Point" &&
      Array.isArray(user.geo.coordinates) &&
      user.geo.coordinates.length === 2 &&
      user.geo.coordinates.every(
        (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)
      ) &&
      user.geo) ||
    buildGeoPointFromLocation(location);
  const radiusKm = clampRadiusKm(user?.searchRadiusKm);

  if (!location) {
    return {
      status: "needs_location",
      mode: "none",
      radiusKm,
      summary:
        "Save your NGO location in Account Settings to see donor outlets near you.",
      location,
      geo,
      fallbackMatcher,
    };
  }

  if (geo) {
    return {
      status: "ready",
      mode: "geo",
      radiusKm,
      radiusMeters: radiusKm * 1000,
      summary: fallbackMatcher
        ? `Showing donor outlets within ${radiusKm} km of your saved NGO location, plus address-only outlets in your local area.`
        : `Showing donor outlets within ${radiusKm} km of your saved NGO location.`,
      location,
      geo,
      fallbackMatcher,
    };
  }

  if (fallbackMatcher) {
    return {
      status: "ready",
      mode: fallbackMatcher.mode,
      radiusKm,
      summary: `GPS coordinates are not saved yet, so we are ${fallbackMatcher.summary}`,
      location,
      geo,
      fallbackMatcher,
    };
  }

  return {
    status: "needs_more_detail",
    mode: "none",
    radiusKm,
    summary:
      "Add a pincode, city and state, or GPS coordinates in Account Settings to enable nearby donor matching.",
    location,
    geo,
    fallbackMatcher,
  };
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceKm = (fromGeo, toGeo) => {
  if (
    !fromGeo ||
    !toGeo ||
    fromGeo.type !== "Point" ||
    toGeo.type !== "Point" ||
    !Array.isArray(fromGeo.coordinates) ||
    !Array.isArray(toGeo.coordinates)
  ) {
    return undefined;
  }

  const [fromLongitude, fromLatitude] = fromGeo.coordinates;
  const [toLongitude, toLatitude] = toGeo.coordinates;

  if (
    ![fromLongitude, fromLatitude, toLongitude, toLatitude].every(
      (value) => typeof value === "number" && Number.isFinite(value)
    )
  ) {
    return undefined;
  }

  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const angularDistance =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * angularDistance;
};

const getOutletGeo = (outlet) =>
  (outlet?.geo?.type === "Point" && Array.isArray(outlet.geo.coordinates) && outlet.geo) ||
  buildGeoPointFromLocation(outlet?.location);

const annotateOutletMatch = (outlet, matchPlan, matchMode) => {
  const normalizedOutlet =
    typeof outlet?.toObject === "function" ? outlet.toObject() : { ...outlet };
  const outletGeo = getOutletGeo(normalizedOutlet);
  const distanceKm = calculateDistanceKm(matchPlan?.geo, outletGeo);

  return {
    ...normalizedOutlet,
    matchMode,
    distanceKm:
      typeof distanceKm === "number" && Number.isFinite(distanceKm)
        ? Number(distanceKm.toFixed(1))
        : undefined,
  };
};

const buildMissingGeoFilter = () => ({
  $or: [{ geo: { $exists: false } }, { geo: null }, { "geo.coordinates.0": { $exists: false } }],
});

const dedupeOutletsById = (outlets) => {
  const seenIds = new Set();

  return outlets.filter((outlet) => {
    const outletId = String(outlet?._id || "");

    if (!outletId || seenIds.has(outletId)) {
      return false;
    }

    seenIds.add(outletId);
    return true;
  });
};

const findMatchingDonorOutletsForNgo = async (user, { openOnly = false } = {}) => {
  const matchPlan = buildNgoMatchPlan(user);

  if (matchPlan.status !== "ready") {
    return {
      outlets: [],
      matching: matchPlan,
    };
  }

  const baseFilter = openOnly ? { isOpen: true } : {};
  const matchedOutlets = [];

  if (matchPlan.mode === "geo" && matchPlan.geo) {
    const geoMatches = await DonerModel.find({
      ...baseFilter,
      geo: {
        $nearSphere: {
          $geometry: matchPlan.geo,
          $maxDistance: matchPlan.radiusMeters,
        },
      },
    }).lean();

    matchedOutlets.push(
      ...geoMatches.map((outlet) => annotateOutletMatch(outlet, matchPlan, "geo"))
    );

    if (matchPlan.fallbackMatcher) {
      const fallbackMatches = await DonerModel.find({
        ...baseFilter,
        ...buildMissingGeoFilter(),
        ...matchPlan.fallbackMatcher.query,
      })
        .sort(sortLatestFirst)
        .lean();

      matchedOutlets.push(
        ...fallbackMatches.map((outlet) =>
          annotateOutletMatch(outlet, matchPlan, matchPlan.fallbackMatcher.mode)
        )
      );
    }
  } else if (matchPlan.fallbackMatcher) {
    const fallbackMatches = await DonerModel.find({
      ...baseFilter,
      ...matchPlan.fallbackMatcher.query,
    })
      .sort(sortLatestFirst)
      .lean();

    matchedOutlets.push(
      ...fallbackMatches.map((outlet) =>
        annotateOutletMatch(outlet, matchPlan, matchPlan.fallbackMatcher.mode)
      )
    );
  }

  const dedupedOutlets = dedupeOutletsById(matchedOutlets);

  if (matchPlan.mode === "geo") {
    dedupedOutlets.sort((firstOutlet, secondOutlet) => {
      const firstDistance =
        typeof firstOutlet.distanceKm === "number"
          ? firstOutlet.distanceKm
          : Number.POSITIVE_INFINITY;
      const secondDistance =
        typeof secondOutlet.distanceKm === "number"
          ? secondOutlet.distanceKm
          : Number.POSITIVE_INFINITY;

      if (firstDistance !== secondDistance) {
        return firstDistance - secondDistance;
      }

      return (
        new Date(secondOutlet.updatedAt || secondOutlet.createdAt || 0).getTime() -
        new Date(firstOutlet.updatedAt || firstOutlet.createdAt || 0).getTime()
      );
    });
  }

  return {
    outlets: dedupedOutlets,
    matching: matchPlan,
  };
};

const evaluateDonorOutletForNgo = (user, outlet) => {
  const matchPlan = buildNgoMatchPlan(user);

  if (matchPlan.status !== "ready") {
    return {
      matches: false,
      matching: matchPlan,
    };
  }

  const outletLocation = normalizeLocationInput(outlet?.location);
  const outletGeo = getOutletGeo(outlet);

  if (matchPlan.mode === "geo" && matchPlan.geo && outletGeo) {
    const distanceKm = calculateDistanceKm(matchPlan.geo, outletGeo);

    if (typeof distanceKm === "number" && distanceKm <= matchPlan.radiusKm) {
      return {
        matches: true,
        matching: matchPlan,
        matchMode: "geo",
        distanceKm: Number(distanceKm.toFixed(1)),
      };
    }
  }

  if (matchPlan.fallbackMatcher?.matches(outletLocation)) {
    return {
      matches: true,
      matching: matchPlan,
      matchMode: matchPlan.fallbackMatcher.mode,
      distanceKm:
        typeof calculateDistanceKm(matchPlan.geo, outletGeo) === "number"
          ? Number(calculateDistanceKm(matchPlan.geo, outletGeo).toFixed(1))
          : undefined,
    };
  }

  return {
    matches: false,
    matching: matchPlan,
  };
};

module.exports = {
  buildNgoMatchPlan,
  evaluateDonorOutletForNgo,
  findMatchingDonorOutletsForNgo,
};
