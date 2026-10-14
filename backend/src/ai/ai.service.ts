import axios from "axios";
import { config } from "../config";
import logger from "../config/logger";

/**
 * Pull a JSON object out of an LLM reply. Reasoning models often prepend
 * <think>…</think> blocks or wrap the payload in ```json fences.
 */
export const extractJson = (content: unknown): Record<string, any> | null => {
  if (typeof content !== "string") return null;
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "")
    .trim();
  const candidates = [cleaned];
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(cleaned.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // try the next candidate
    }
  }
  return null;
};

export class AIService {
  private static getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.ai.apiKey}`,
    };
  }

  private static getEndpoint() {
    return `${config.ai.endpoint}/chat/completions`;
  }

  static async analyzeCode(code: string, language: string) {
    try {
      const response = await axios.post(
        this.getEndpoint(),
        {
          model: config.ai.model,
          messages: [
            {
              role: "system",
              content: `You are an expert code reviewer. Analyze the following ${language} code and provide:
              1. Code quality score (0-100)
              2. Bug detection
              3. Optimization suggestions
              4. Complexity analysis
              5. Best practices adherence
              Return as JSON with keys: codeQualityScore, bugs, optimizations, complexity, bestPractices.`,
            },
            { role: "user", content: code },
          ],
          temperature: 0.3,
        },
        { headers: this.getHeaders() },
      );

      const content = response.data.choices[0].message.content;
      return extractJson(content) ?? { raw: content, codeQualityScore: null };
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
    proctoringSummary?: unknown;
  }) {
    try {
      const response = await axios.post(
        this.getEndpoint(),
        {
          model: config.ai.model,
          messages: [
            {
              role: "system",
              content: `You are an AI interview analyst. Generate a comprehensive interview report with:
              1. Technical score (0-100)
              2. Communication score (0-100)
              3. Confidence score (0-100)
              4. Problem-solving score (0-100)
              5. Code quality score (0-100)
              6. Overall score (0-100)
              7. Summary (string)
              8. Strengths (array of strings)
              9. Weaknesses (array of strings)
              10. Recommendations (array of strings)
              11. Hiring recommendation (STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE)
              The input includes proctoring data (cheatingEvents, proctoringSummary with an integrityScore 0-100).
              Mention any integrity concerns explicitly in the summary and weaknesses. If the integrity risk is HIGH or CRITICAL,
              the hiring recommendation must not be better than NO_HIRE without a stated justification.
              Return as JSON with keys: technicalScore, communicationScore, confidenceScore, problemSolvingScore, codeQualityScore, overallScore, summary, strengths, weaknesses, recommendations, hiringRecommendation.`,
            },
            { role: "user", content: JSON.stringify(data) },
          ],
          temperature: 0.3,
        },
        { headers: this.getHeaders() },
      );

      const content = response.data.choices[0].message.content;
      return extractJson(content) ?? { raw: content };
    } catch (error) {
      logger.error("AI report generation failed:", error);
      return null;
    }
  }

  static async matchResumeToJob(resumeData: any, jobDescription: string) {
    try {
      const response = await axios.post(
        this.getEndpoint(),
        {
          model: config.ai.model,
          messages: [
            {
              role: "system",
              content: `You are an ATS (Applicant Tracking System) analyzer. Compare the resume against the job description and provide:
              1. ATS score (0-100)
              2. Matching skills (array)
              3. Missing skills (array)
              4. Experience match level (string)
              5. Recommendations for the candidate (array)
              Return as JSON with keys: atsScore, matchingSkills, missingSkills, experienceMatch, recommendations.`,
            },
            {
              role: "user",
              content: JSON.stringify({ resume: resumeData, jobDescription }),
            },
          ],
          temperature: 0.3,
        },
        { headers: this.getHeaders() },
      );

      const content = response.data.choices[0].message.content;
      return extractJson(content) ?? { raw: content };
    } catch (error) {
      logger.error("AI resume matching failed:", error);
      return null;
    }
  }

  static async analyzeSentiment(transcript: string) {
    try {
      const response = await axios.post(
        this.getEndpoint(),
        {
          model: config.ai.model,
          messages: [
            {
              role: "system",
              content: `Analyze the interview transcript sentiment. Provide:
              1. Overall sentiment (positive/neutral/negative)
              2. Confidence level detected (high/medium/low)
              3. Communication clarity score (0-100)
              4. Key phrases indicating strength/weakness (array)
              Return as JSON with keys: sentiment, confidenceLevel, communicationClarity, keyPhrases.`,
            },
            { role: "user", content: transcript },
          ],
          temperature: 0.3,
        },
        { headers: this.getHeaders() },
      );

      const content = response.data.choices[0].message.content;
      return extractJson(content) ?? { raw: content };
    } catch (error) {
      logger.error("AI sentiment analysis failed:", error);
      return null;
    }
  }
}
