import axios from "axios";
import { config } from "../config";
import logger from "../config/logger";

export class AIService {
  private static openaiHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.openai.apiKey}`,
  };

  static async analyzeCode(code: string, language: string) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: config.openai.model,
          messages: [
            {
              role: "system",
              content: `You are an expert code reviewer. Analyze the following ${language} code and provide:
              1. Code quality score (0-100)
              2. Bug detection
              3. Optimization suggestions
              4. Complexity analysis
              5. Best practices adherence
              Return as JSON.`,
            },
            { role: "user", content: code },
          ],
          temperature: 0.3,
        },
        { headers: this.openaiHeaders },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error("AI code analysis failed:", error);
      return null;
    }
  }

  static async generateInterviewReport(data: {
    technicalPerformance: string;
    communicationNotes: string;
    codeSubmissions: string[];
    cheatingEvents: any[];
  }) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: config.openai.model,
          messages: [
            {
              role: "system",
              content: `You are an AI interview analyst. Generate a comprehensive interview report with:
              1. Technical score (0-100)
              2. Communication score (0-100)
              3. Confidence score (0-100)
              4. Problem-solving score (0-100)
              5. Overall score (0-100)
              6. Summary
              7. Strengths (array)
              8. Weaknesses (array)
              9. Hiring recommendation (STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE)
              Return as JSON.`,
            },
            { role: "user", content: JSON.stringify(data) },
          ],
          temperature: 0.3,
        },
        { headers: this.openaiHeaders },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error("AI report generation failed:", error);
      return null;
    }
  }

  static async matchResumeToJob(resumeData: any, jobDescription: string) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: config.openai.model,
          messages: [
            {
              role: "system",
              content: `You are an ATS (Applicant Tracking System) analyzer. Compare the resume against the job description and provide:
              1. ATS score (0-100)
              2. Matching skills
              3. Missing skills
              4. Experience match level
              5. Recommendations for the candidate
              Return as JSON.`,
            },
            {
              role: "user",
              content: JSON.stringify({ resume: resumeData, jobDescription }),
            },
          ],
          temperature: 0.3,
        },
        { headers: this.openaiHeaders },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error("AI resume matching failed:", error);
      return null;
    }
  }

  static async analyzeSentiment(transcript: string) {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: config.openai.model,
          messages: [
            {
              role: "system",
              content: `Analyze the interview transcript sentiment. Provide:
              1. Overall sentiment (positive/neutral/negative)
              2. Confidence level detected
              3. Communication clarity score (0-100)
              4. Key phrases indicating strength/weakness
              Return as JSON.`,
            },
            { role: "user", content: transcript },
          ],
          temperature: 0.3,
        },
        { headers: this.openaiHeaders },
      );

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error("AI sentiment analysis failed:", error);
      return null;
    }
  }
}
