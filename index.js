import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes/index.js";
import morgan from "morgan";
import fs from "fs";
const app = express();
// parse urlencoded data
app.use(express.urlencoded({ extended: true }));
// parse application/json
app.use(express.json());

app.use(cookieParser());

app.use(cors());
app.options("*", cors());

mongoose.set("strictQuery", false);
mongoose.connect(
  process.env.MONGO_URL || "mongodb://localhost:27017/storage-system",
  {
    useNewUrlParser: true,
  },
  (err) => {
    if (err) {
      console.info("❌ " + "Mongodb Connection Error");
      console.error(err);
    } else {
      console.info("✅ " + "Mongodb Connected");
    }
  }
);
const db = mongoose.connection;

db.on("error", () => {
  throw new Error("❌Unable to connect to database at storage-system");
});

db.once("open", () => {
  console.info("✅ Connected to Database : storage-system");
});

// setup morgan for logging
app.use(morgan("dev"));

app.use(routes);

app.listen(8001, () => {
  console.info(`🚀 Express server listening on port 8001`);
});

// check if public and public/upload folder exists
if (!fs.existsSync("public")) {
  fs.mkdirSync("public");
  fs.mkdirSync("public/upload");
}

app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "No such API exists",
  });
});
