import { NextRequest } from "next/server";
import { refreshTokens } from "@/lib/gotrue";

jest.mock("@/lib/gotrue", () => ({
  refreshTokens: jest.fn(),
}));

const mockedRefreshTokens = refreshTokens as jest.Mock;

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:4000/api/auth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/token", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns a fresh envelope on successful refresh", async () => {
    mockedRefreshTokens.mockResolvedValue({
      access_token: "new-access",
      refresh_token: "new-refresh",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: "user-123", email: "user@example.com" },
    });

    const { POST } = await import("@/app/api/auth/token/route");
    const res = await POST(postRequest({ refresh_token: "stale-token" }));

    expect(mockedRefreshTokens).toHaveBeenCalledWith("stale-token");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.access_token).toBe("new-access");
    expect(json.refresh_token).toBe("new-refresh");
  });

  it("maps refresh failures to 401", async () => {
    mockedRefreshTokens.mockRejectedValue(
      Object.assign(new Error("Invalid Refresh Token"), { status: 401 }),
    );

    const { POST } = await import("@/app/api/auth/token/route");
    const res = await POST(postRequest({ refresh_token: "bogus" }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_credentials");
  });

  it("returns 400 when refresh_token is missing", async () => {
    const { POST } = await import("@/app/api/auth/token/route");
    const res = await POST(postRequest({}));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_request");
  });
});
