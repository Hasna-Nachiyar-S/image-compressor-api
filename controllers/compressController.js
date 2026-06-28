const fs = require("fs");
const path = require("path");

const compressImage = require("../services/imageService");
const downloadFile = require("../services/downloadFileService");

function normalizeCompressionLevel(value) {
  const num = Number(value);

  if (isNaN(num)) return 50;

  return Math.max(1, Math.min(100, num));
}

exports.compressFromUrl = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { fileUrl, fileName, compressionLevel } = req.body;

    console.log("Received compressionLevel:", compressionLevel);

    if (!fileUrl || !fileName) {
      return res.status(400).json({
        success: false,
        message: "fileUrl and fileName required",
      });
    }

    const normalizedLevel = normalizeCompressionLevel(compressionLevel);

    console.log("Normalized Level:", normalizedLevel);

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
    } else {
      result = await compressDocument(localFile, normalizedLevel);
    }

    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }

    const downloadFileName = path.basename(result.outputPath);

    const downloadUrl = `https://file-compressor-api-kgy8.onrender.com/download/${downloadFileName}`;

    return res.json({
      success: true,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      reductionPercent: result.reductionPercent,
      compressionLevel: normalizedLevel,
      quality: result.quality,
      width: result.width,
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
