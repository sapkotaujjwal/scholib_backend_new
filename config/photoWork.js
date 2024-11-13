require("dotenv").config({ path: "./config.env" });
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { encode } = require("blurhash");
const cloudinary = require("./cloudinary");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

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

const s3 = new S3Client({ region: process.env.awsRegion });
const bucketName = process.env.bucketName;

// upload image to s3
async function uploadImage(filename, filePath) {
  // const filename = "flower.jpeg";
  // const filePath = path.join(__dirname, filename);

  try {
    const data = fs.readFileSync(filePath);

    const s3Key = `${filename}`;
    const params = {
      Bucket: bucketName,
      Key: s3Key,
      Body: data,
      ContentType: "image/jpeg",
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);

    return {
      secure_url: `https://${bucketName}.s3.amazonaws.com/${s3Key}`,
      public_id: s3Key,
    };
  } catch (err) {
    console.error("Error Uploading file:", err);
  }
}

// delete the image from the server
async function deleteImage(key) {
  try {
    // to delete from cloudinary not required

    // await cloudinary.uploader.destroy(
    //   key,
    //   (error, result) => {
    //     if (error) {
    //       return res.status(500).send({
    //         success: false,
    //         status: "Image deletion failed",
    //         message: `${error.message}`,
    //       });
    //     }
    //   }
    // );

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);
  } catch (err) {
    console.error("Error deleting file:", err);
  }
}

// main photoWork function
async function photoWork(photo) {
  try {
    const photoFile = photo;
    const compressedImage = await imageCompressor(photoFile.path);

    // const result = await cloudinary.uploader.upload(
    //   compressedImage.compressedImagePath,
    //   {
    //     quality: "auto:best",
    //     fetch_format: "auto",
    //   }
    // );

    const result = await uploadImage(
      photo.filename,
      compressedImage.compressedImagePath
    );

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
    console.log(error);
    throw new Error(error.message);
  }
}

module.exports = { photoWork, deleteImage };
