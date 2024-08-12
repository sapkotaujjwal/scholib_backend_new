require("dotenv").config({ path: "./config.env" });
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { encode } = require("blurhash");
const cloudinary = require("./cloudinary")


async function generateBlurHash(imagePath) {
  return new Promise((resolve, reject) => {
    sharp(imagePath)
      .raw()
      .ensureAlpha()
      .resize(32, 32, { fit: "inside" })
      .toBuffer((err, buffer, { width, height }) => {
        if (err) return reject(err);
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4));
      });
  });
}


async function imageCompressor(inputImagePath) {
  try {
    const inputImage = sharp(inputImagePath);
    const metadata = await inputImage.metadata();
    const width = metadata.width;
    const height = metadata.height;
    const aspectRatio = width / height;
    const targetFileSize = 1200 * 1024;
    const newWidth = Math.sqrt(targetFileSize * aspectRatio);
    const newHeight = newWidth / aspectRatio;
    const compressedImageBuffer = await inputImage
      .resize(Math.round(newWidth), Math.round(newHeight))
      // Remove the .jpeg() method to preserve the original format
      .toBuffer();
    const compressedImagePath = path.join(
      __dirname,
      "..",
      "uploads",
      "compressed_image." + metadata.format
    );

    fs.writeFileSync(compressedImagePath, compressedImageBuffer);
    return {
      compressedImagePath,
      width: newWidth,
      height: newHeight,
    };
  } catch (error) {
    console.error("Error compressing image:", error);
    throw new Error("Image compression failed");
  }
}



async function photoWork(photo) {
  try {
    const photoFile = photo;
    const compressedImage = await imageCompressor(photoFile.path);
    const result = await cloudinary.uploader.upload(compressedImage.compressedImagePath, {
      quality: "auto:best",
      fetch_format: "auto",
    });

    const blurHash = await generateBlurHash(photoFile.path);
    const photoObject = {
      blurHash: blurHash,
      secure_url: result.secure_url,
      public_id: result.public_id,
      height: compressedImage.height,
      width: compressedImage.width,
    };
    fs.unlink(photoFile.path, () => {});
    fs.unlink(compressedImage.compressedImagePath, () => {});

    return photoObject;
  } catch (error) {
    console.log(error)
    throw new Error(error.message);
  }
}

module.exports = { photoWork };
















// some old commented functions


// async function imageCompressor(inputImagePath) {
//   try {
//     const inputImage = sharp(inputImagePath);
//     const metadata = await inputImage.metadata();
//     const width = metadata.width;
//     const height = metadata.height;
//     const aspectRatio = width / height;
//     const targetFileSize = 1200 * 1024;
//     const newWidth = Math.sqrt(targetFileSize * aspectRatio);
//     const newHeight = newWidth / aspectRatio;
//     const quality = 93;
//     const compressedImageBuffer = await inputImage
//       .resize(Math.round(newWidth), Math.round(newHeight))
//       .jpeg({ quality: quality })
//       .toBuffer();
//     const compressedImagePath = path.join(
//       __dirname,
//       "..",
//       "uploads",
//       "compressed_image.jpg"
//     );

//     fs.writeFileSync(compressedImagePath, compressedImageBuffer);
//     return {
//       compressedImagePath,
//       width: newWidth,
//       height: newHeight,
//     };
//   } catch (error) {
//     console.error("Error compressing image:", error);
//     throw new Error("Image compression failed");
//   }
// }

// uploading to cloudinary
