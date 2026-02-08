const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
const fs = require("fs");
const sharp = require("sharp");

dotenv.config();

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const path = require("path");
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    let uploadPath = req.file.path;

    // If HEIC, convert to JPEG
    if (ext === ".heic" || ext === ".heif") {
      const jpgPath = req.file.path + ".jpg";
      await sharp(req.file.path).jpeg().toFile(jpgPath);
      fs.unlinkSync(req.file.path); // Remove original .heic
      uploadPath = jpgPath;
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const base = path.basename(req.file.originalname, ext);

    const result = await cloudinary.uploader.upload(uploadPath, {
      folder: "BrentJurkovski",
      public_id: `${base}-${uniqueSuffix}`,
    });
    fs.unlinkSync(uploadPath);
    res.json({ url: result.secure_url });
    console.log("Uploaded to:", result.public_id);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all images in the "Brent" folder
app.get("/images", async (req, res) => {
  try {
    const result = await cloudinary.search
      .expression("folder:BrentJurkovski")
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
