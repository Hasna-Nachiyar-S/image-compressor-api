const axios = require("axios");
const fs = require("fs");

async function downloadFile(url, outputPath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports = downloadFile;
