import express from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();



const router = express.Router();

// Initialize the S3 Client with your .env credentials
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Route to generate a temporary Presigned URL for uploading
router.post("/get-upload-url", async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: "fileName and fileType are required" });
    }

    // Create a totally unique file name to prevent users from overwriting each other's files
    const uniqueFileName = `${Date.now()}-${fileName}`;

    // Configure the upload parameters
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    // Generate a secure upload URL that automatically expires in 60 seconds
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    // Send the upload link and the unique fileKey back to React
    res.json({
      success: true,
      uploadUrl,
      fileKey: uniqueFileName,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({ error: "Failed to generate upload tokens. Please try again." });
  }
});

export default router;
