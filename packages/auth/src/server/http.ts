import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "invalid_request"
  | "invalid_credentials"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "email_not_confirmed"
  | "server_error";

export function apiError(status: number, code: ApiErrorCode, message?: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function handleRouteError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    return apiError(400, "invalid_request", details);
  }
  console.error("[auth] unhandled error:", err);
  return apiError(500, "server_error");
}

interface AuthErrorLike {
  status?: number;
  message?: string;
  code?: string;
}

export function authErrorResponse(error: AuthErrorLike): NextResponse {
  const status = error.status ?? 500;
  const message = error.message ?? "Authentication request failed";

  if (status === 429) {
    return apiError(429, "rate_limited", "Too many requests. Try again later.");
  }
  if (status === 400 || status === 401) {
    if (error.code === "email_not_confirmed" || /confirm/i.test(message)) {
      return apiError(403, "email_not_confirmed", "Email address is not confirmed.");
    }
    return apiError(401, "invalid_credentials", "Invalid email or password.");
  }
  if (status === 422) {
    return apiError(400, "invalid_request", message);
  }
  return apiError(500, "server_error");
}
