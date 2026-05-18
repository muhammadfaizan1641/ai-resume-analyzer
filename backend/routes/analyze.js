import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { extractText } from "unpdf";

dotenv.config();

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    let resumeText = "";

    if (req.file.mimetype === "application/pdf") {
      const uint8Array = new Uint8Array(req.file.buffer);
      const { text } = await extractText(uint8Array, { mergePages: true });
      resumeText = text;
    } else {
      resumeText = req.file.buffer.toString("utf-8");
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        error: "Could not extract text from the resume. Please upload a text-based PDF.",
      });
    }

    const jobRole = req.body.jobRole || "Software Engineer";

    const prompt = `
You are an expert resume analyst and career coach. Analyze the following resume for the job role: "${jobRole}".

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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;

    const cleanedText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const analysis = JSON.parse(cleanedText);

    res.json({ success: true, analysis, jobRole });
  } catch (error) {
    console.error("Error analyzing resume:", error);
    if (error instanceof SyntaxError) {
      res.status(500).json({ error: "Failed to parse AI response. Please try again." });
    } else {
      res.status(500).json({ error: error.message || "Something went wrong. Please try again." });
    }
  }
});

export default router;