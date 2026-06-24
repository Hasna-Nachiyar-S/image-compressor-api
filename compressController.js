const fs = require("fs");
const path = require("path");

const compressImage = require("../services/imageService");
const compressDocument = require("../services/documentService");
const downloadFile = require("../services/downloadFileService");

function normalizeCompressionLevel(value) {
  const num = Number(value);

  if (isNaN(num)) return 50;

  return Math.max(1, Math.min(100, num));
}

exports.compressFromUrl = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { fileUrl, fileName, compressionLevel } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({
        success: false,
        message: "fileUrl and fileName required",
      });
    }

    const normalizedLevel = normalizeCompressionLevel(compressionLevel);

    const extension = fileName.split(".").pop().toLowerCase();

    const imageExtensions = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif",
      "bmp",
      "tiff",
    ];

    const localFile = path.join("uploads", `${Date.now()}.${extension}`);

    await downloadFile(fileUrl, localFile);

    let result;

    if (imageExtensions.includes(extension)) {
      result = await compressImage(localFile, normalizedLevel);
      console.log("RESULT OUTPUT:", result.outputPath);
    } else {
      result = await compressDocument(localFile, normalizedLevel);
    }

    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }

    const fileNameForDownload = path.basename(result.outputPath);

    const downloadUrl = `https://file-compressor-api-kgy8.onrender.com/download/${fileNameForDownload}`;

    return res.json({
      success: true,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      quality: result.quality,
      width: result.width,
      compressionLevel: normalizedLevel,
      reductionPercent: result.reductionPercent,
      downloadUrl,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
