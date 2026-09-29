import express from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { extractText } from "unpdf";

dotenv.config();

const router = express.Router();
// const upload = multer({ storage: multer.memoryStorage() });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Initialize the S3 client to fetch uploaded files
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to convert an S3 readable stream into a standard Node.js Buffer
const streamToBuffer = async (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

router.post("/analyze", async (req, res) => {
  try {
    const { fileKey, jobRole } = req.body;

    // 1. Validation Check
    if (!fileKey) {
      return res
        .status(400)
        .json({
          error: "Missing fileKey. Please upload the file to storage first.",
        });
    }

    const targetJobRole = jobRole || "Software Engineer";
    // if (!req.file) {
    //   return res.status(400).json({ error: "No file uploaded" });
    // }

    // 2. Fetch the file directly from your AWS S3 Bucket
    let s3Object;
    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
      });
      s3Object = await s3.send(command);
    } catch (s3Error) {
      console.error("Error fetching file from S3:", s3Error);
      return res
        .status(404)
        .json({ error: "Resume file not found in cloud storage." });
    }

    // 3. Convert the incoming S3 stream data into a working Buffer
    const fileBuffer = await streamToBuffer(s3Object.Body);
    const contentType = s3Object.ContentType;

    let resumeText = "";

    // 4. Run the polymorphic text extraction pipeline
    if (contentType === "application/pdf") {
      const uint8Array = new Uint8Array(fileBuffer);
      const { text } = await extractText(uint8Array, { mergePages: true });
      resumeText = text;
    } else {
      resumeText = fileBuffer.toString("utf-8");
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error:
          "Could not extract text from the resume. Please upload a text-based PDF.",
      });
    }

    // const jobRole = req.body.jobRole || "Software Engineer";

    const prompt = `
You are an expert resume analyst and career coach. Analyze the following resume for the job role: "${targetJobRole}".

Resume Content:
"""
${resumeText}
"""

Provide a comprehensive analysis in the following EXACT JSON format (no markdown, no extra text, just valid JSON):
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall impression>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>", "<suggestion 4>"],
  "skillsFound": ["<skill1>", "<skill2>", "<skill3>"],
  "missingSkills": ["<missing skill1>", "<missing skill2>", "<missing skill3>"],
  "atsScore": <number 0-100>,
  "experienceLevel": "<Fresher | Junior | Mid-level | Senior | Lead>",
  "sectionScores": {
    "contact": <number 0-100>,
    "experience": <number 0-100>,
    "education": <number 0-100>,
    "skills": <number 0-100>,
    "projects": <number 0-100>
  },
  "keywordsMatched": ["<keyword1>", "<keyword2>"],
  "formatFeedback": "<feedback on resume format and structure>"
}
`;
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "qwen/qwen3.8-27b",
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const responseText = response.choices[0].message.content;

    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(cleanedText);

    res.json({ success: true, analysis, jobRole: targetJobRole });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    if (error instanceof SyntaxError) {
      res
        .status(500)
        .json({ error: "Failed to parse AI response. Please try again." });
    } else {
      res
        .status(500)
        .json({
          error: error.message || "Something went wrong. Please try again.",
        });
    }
  }
});

export default router;
