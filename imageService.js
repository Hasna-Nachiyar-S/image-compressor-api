console.log("compressImage() level =", compressionLevel);

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

function normalizeLevel(level = 50) {
  return Math.max(1, Math.min(100, Number(level) || 50));
}

function getJpegQuality(level) {
  // Slider 1 -> 98 quality
  // Slider 100 -> 20 quality
  return Math.round(98 - ((level - 1) * 78) / 99);
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

  console.log("Compression Level:", level);

  //------------------------------------------
  // PNG
  //------------------------------------------

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
  }

  //------------------------------------------
  // WEBP
  //------------------------------------------
  else if (outputExtension === ".webp") {
    const quality = Math.max(15, 100 - level);

    console.log("WEBP Quality:", quality);

    await pipeline
      .webp({
        quality,
      })
      .toFile(outputPath);
  }

  //------------------------------------------
  // JPEG
  //------------------------------------------
  else {
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

  if (compressedSize >= originalSize) {
    fs.unlinkSync(outputPath);

    return {
      outputPath: inputPath,
      originalSize,
      compressedSize: originalSize,
      reductionPercent: "0.00",
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
  };
}

module.exports = compressImage;
