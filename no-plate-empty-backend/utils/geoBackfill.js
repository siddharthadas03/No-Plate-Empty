const DonerModel = require("../models/DonerModel");
const User = require("../models/user");
const { buildGeoPointFromLocation } = require("./location");

const findDocumentsMissingGeo = (Model) =>
  Model.find({
    $or: [{ geo: { $exists: false } }, { geo: null }, { "geo.coordinates.0": { $exists: false } }],
    "location.latitude": { $type: "number" },
    "location.longitude": { $type: "number" },
  }).lean();

const backfillModelGeo = async (Model) => {
  const documents = await findDocumentsMissingGeo(Model);

  if (documents.length === 0) {
    return 0;
  }

  const operations = documents
    .map((document) => {
      const geo = buildGeoPointFromLocation(document.location);

      if (!geo) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: document._id },
          update: {
            $set: { geo },
          },
        },
      };
    })
    .filter(Boolean);

  if (operations.length === 0) {
    return 0;
  }

  await Model.bulkWrite(operations, { ordered: false });

  return operations.length;
};

const backfillStoredGeoPoints = async () => {
  const [updatedUsers, updatedDonors] = await Promise.all([
    backfillModelGeo(User),
    backfillModelGeo(DonerModel),
  ]);

  return {
    updatedUsers,
    updatedDonors,
  };
};

module.exports = {
  backfillStoredGeoPoints,
};
