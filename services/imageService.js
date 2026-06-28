const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

function normalizeLevel(level = 50) {
  return Math.max(1, Math.min(100, Number(level) || 50));
}

function getJpegQuality(level) {
  return Math.round(98 - ((level - 1) * 78) / 99);
}

async function compressImage(inputPath, compressionLevel = 50) {
  console.log("==============================");
  console.log("compressImage()");
  console.log("Input Level:", compressionLevel);

  const level = normalizeLevel(compressionLevel);

  console.log("Normalized Level:", level);

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

    default:
      outputExtension = ".jpg";
  }

  const outputPath = path.join("compressed", `${Date.now()}${outputExtension}`);

  let pipeline = sharp(inputPath);

  if (metadata.width > 2500) {
    pipeline = pipeline.resize({
      width: 2500,
      withoutEnlargement: true,
    });
  }

  if (outputExtension === ".png") {
    const quality = Math.max(20, 100 - level);

    console.log("PNG Quality:", quality);

    await pipeline
      .png({
        palette: true,
        quality,
        effort: 10,
      })
      .toFile(outputPath);
  } else if (outputExtension === ".webp") {
    const quality = Math.max(15, 100 - level);

    console.log("WEBP Quality:", quality);

    await pipeline
      .webp({
        quality,
      })
      .toFile(outputPath);
  } else {
    const quality = getJpegQuality(level);

    console.log("JPEG Quality:", quality);

    await pipeline
      .jpeg({
        quality,
        mozjpeg: true,
        progressive: true,
      })
      .toFile(outputPath);
  }

  const compressedSize = fs.statSync(outputPath).size;

  console.log("Original Size:", originalSize);
  console.log("Compressed Size:", compressedSize);

  if (compressedSize >= originalSize) {
    fs.unlinkSync(outputPath);

    return {
      outputPath: inputPath,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: "0.00",
      quality: level,
      width: metadata.width,
    };
  }

  const reductionPercent = (
    ((originalSize - compressedSize) / originalSize) *
    100
  ).toFixed(2);

  return {
    outputPath,
    originalSize,
    compressedSize,
    reductionPercent,
    quality: level,
    width: metadata.width,
  };
}

module.exports = compressImage;
