console.log("SERVER.JS LOADED");

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const compressRoutes = require("./routes/compressRoutes");

const app = express();

app.set("trust proxy", true);

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
app.get("/download/:filename", (req, res) => {
  console.log("DOWNLOAD ROUTE HIT:", req.params.filename);

  const filePath = path.join(__dirname, "compressed", req.params.filename);

  console.log("FILE PATH:", filePath);

  res.download(filePath);
});

if (!fs.existsSync("compressed")) {
  fs.mkdirSync("compressed");
}

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  }),
);

/*
  KEEP STATIC ACCESS OPTIONAL
  Useful for testing files directly
*/
app.use("/compressed", express.static("compressed"));

/*
  FORCE DOWNLOAD ROUTE
*/
app.get("/download/:filename", (req, res) => {
  try {
    const filePath = path.join(__dirname, "compressed", req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    return res.download(filePath);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Download failed",
    });
  }
});

app.use("/compress", compressRoutes);

app.get("/", (req, res) => {
  res.send("File Compressor API Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
