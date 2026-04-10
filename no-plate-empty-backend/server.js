const app = require("./app");
const connectDB = require("./config/db");
const { backfillStoredGeoPoints } = require("./utils/geoBackfill");

app.use("/api/v1/category", require("./routes/categoryRoutes"));
app.use("/api/v1/Doner", require("./routes/DonerRoutes"));
app.use("/api/v1/food", require("./routes/foodRoutes"));

const startServer = async () => {
  try {
    await connectDB();

    const { updatedUsers, updatedDonors } = await backfillStoredGeoPoints();

    if (updatedUsers > 0 || updatedDonors > 0) {
      console.log(
        `Geo backfill complete: ${updatedUsers} user(s), ${updatedDonors} donor outlet(s)`
      );
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed", error);
    process.exit(1);
  }
};

void startServer();
