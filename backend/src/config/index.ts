import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    url: process.env.DATABASE_URL || "",
  },

  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "access-secret-change-me",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "refresh-secret-change-me",
    accessExpiresIn: "15m",
    refreshExpiresIn: "7d",
  },

  cors: {
    origins: (
      process.env.CORS_ORIGIN || "http://localhost:5174,http://localhost:3000"
    )
      .split(",")
      .map((o) => o.trim()),
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "noreply@interviewai.com",
  },

  ai: {
    apiKey: process.env.API_KEY || "",
    model: process.env.MODEL || "minimaxai/minimax-m2.7",
    endpoint:
      process.env.OPENAPI_ENDPOINT || "https://integrate.api.nvidia.com/v1",
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    region: process.env.AWS_REGION || "us-east-1",
    s3Bucket: process.env.AWS_S3_BUCKET || "",
  },

  judge0: {
    apiUrl: process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com",
    apiKey: process.env.JUDGE0_API_KEY || "",
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 100 : 1000,
  },
} as const;
