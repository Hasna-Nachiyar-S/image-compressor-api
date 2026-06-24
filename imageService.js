const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

console.log("IMAGE SERVICE BUILD 2026-06-22");

function normalizeLevel(level = 50) {
  return Math.max(1, Math.min(100, Number(level) || 50));
}

function getJpegQuality(level) {
  return Math.round(95 - ((level - 1) * 35) / 99);
}

async function compressImage(inputPath, compressionLevel = 50) {
  const level = normalizeLevel(compressionLevel);

  const metadata = await sharp(inputPath).metadata();

  const originalSize = fs.statSync(inputPath).size;

  const ext = path.extname(inputPath).toLowerCase();

  let outputExtension;

  switch (ext) {
    case ".png":
      outputExtension = ".png";
      break;

    case ".webp":
      outputExtension = ".webp";
      break;

    case ".jpg":
    case ".jpeg":
    default:
      outputExtension = ".jpg";
      break;
  }

  const outputPath = path.join("compressed", `${Date.now()}${outputExtension}`);

  let targetWidth = metadata.width;

  // Resize only very large images
  if (metadata.width > 2500) {
    targetWidth = 2500;
  }

  console.log("=================================");
  console.log("Compression Level:", level);
  console.log("Format:", metadata.format);
  console.log("Original Width:", metadata.width);
  console.log("Original Height:", metadata.height);
  console.log("Target Width:", targetWidth);
  console.log("Original Size:", originalSize);
  console.log("=================================");

  let pipeline = sharp(inputPath);

  if (targetWidth !== metadata.width) {
    pipeline = pipeline.resize({
      width: targetWidth,
      withoutEnlargement: true,
    });
  }

  /*
   * PNG
   * Lossless optimization only
   */
  if (outputExtension === ".png") {
    await pipeline
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        palette: true,
      })
      .toFile(outputPath);
  } else if (outputExtension === ".webp") {
    /*
     * WEBP
     */
    await pipeline
      .webp({
        quality: Math.max(40, 100 - Math.round(level * 0.6)),
      })
      .toFile(outputPath);
  } else {
    /*
     * JPG / JPEG
     */
    await pipeline
      .jpeg({
        quality: getJpegQuality(level),
        mozjpeg: true,
      })
      .toFile(outputPath);
  }

  const compressedSize = fs.statSync(outputPath).size;

  /*
   * Never return larger files
   */
  if (compressedSize >= originalSize) {
    console.log("Compressed file larger than original. Keeping original.");

    fs.unlinkSync(outputPath);

    return {
      outputPath: inputPath,
      originalSize,
      compressedSize: originalSize,
      quality: outputExtension === ".jpg" ? getJpegQuality(level) : null,
      width: metadata.width,
      reductionPercent: "0.00",
    };
  }

  const reductionPercent = (
    ((originalSize - compressedSize) / originalSize) *
    100
  ).toFixed(2);

  console.log("Compressed Size:", compressedSize);
  console.log("Reduction:", reductionPercent + "%");

  return {
    outputPath,
    originalSize,
    compressedSize,
    quality: outputExtension === ".jpg" ? getJpegQuality(level) : null,
    width: targetWidth,
    reductionPercent,
  };
}

module.exports = compressImage;
