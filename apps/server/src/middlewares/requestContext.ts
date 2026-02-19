import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

const CONTROL_CHARS = /[\r\n\t\x00-\x1F\x7F]/g;

function cleanText(value: unknown, maxLen = 500) {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_CHARS, " ").trim().slice(0, maxLen);
}

function getClientIp(req: Request) {
  const forwarded = req.headers["x-forwarded-for"];

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return cleanText(String(forwarded[0]).split(",")[0], 100);
  }

  if (typeof forwarded === "string" && forwarded.trim()) {
    return cleanText(forwarded.split(",")[0], 100);
  }

  return cleanText(req.ip ?? "", 100);
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const incomingCorrelation = cleanText(req.headers["x-correlation-id"], 100);

  req.requestId = randomUUID();
  req.correlationId = incomingCorrelation || randomUUID();
  req.clientContext = {
    ip: getClientIp(req),
    userAgent: cleanText(req.headers["user-agent"]),
    origin: cleanText(req.headers.origin),
  };

  res.setHeader("x-request-id", req.requestId);
  res.setHeader("x-correlation-id", req.correlationId);

  next();
}
