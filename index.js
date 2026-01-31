const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// app.post("/upload", upload.single("image"), async (req, res) => {
//   try {
//     const result = await cloudinary.uploader.upload(req.file.path, {
//       folder: "wedding", // <-- This ensures all uploads go to the "wedding" folder
//     });
//     fs.unlinkSync(req.file.path);
//     res.json({ url: result.secure_url });
//     console.log("Uploaded to:", result.public_id);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
const path = require("path");
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname);
    const base = path.basename(req.file.originalname, ext);

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "wedding",
      public_id: `${base}-${uniqueSuffix}`,
    });
    fs.unlinkSync(req.file.path);
    res.json({ url: result.secure_url });
    console.log("Uploaded to:", result.public_id);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all images in the "wedding" folder
app.get("/images", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:wedding")
      .sort_by("public_id", "desc")
      .max_results(2000)
      .execute();
    // Return just the URLs (or the whole resource if you want more info)
    const images = result.resources.map((img) => ({
      url: img.secure_url.replace("/upload/", "/upload/w_800/"), // thumbnail
      public_id: img.public_id,
      width: img.width,
      height: img.height,
    }));
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
