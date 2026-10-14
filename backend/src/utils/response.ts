import { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any,
  message: string = "Success",
) => {
  return res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
  });
};

export const sendPaginatedResponse = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number,
  message: string = "Success",
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};
