import type { ErrorRequestHandler } from "express";
import { AppError } from "../types.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: "upstream_unavailable", message: "Internal error" } });
};
