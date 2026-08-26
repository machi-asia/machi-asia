import { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  createPublicClient: jest.fn(),
  createAdminClient: jest.fn(),
}));

const mockedCreatePublicClient = createPublicClient as jest.Mock;

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  afterEach(() => jest.resetAllMocks());

  it("returns a token envelope on success", async () => {
    const session = {
      access_token: "access.jwt.value",
      refresh_token: "refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: "user-123",
        email: "user@example.com",
        app_metadata: { roles: ["admin"] },
      },
    };
    mockedCreatePublicClient.mockReturnValue({
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({ data: { session, user: session.user }, error: null }),
      },
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(postRequest({ email: "user@example.com", password: "supersecret" }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.access_token).toBe("access.jwt.value");
    expect(json.refresh_token).toBe("refresh-token");
    expect(json.token_type).toBe("bearer");
    expect(json.user.roles).toEqual(["admin"]);
  });

  it("maps bad credentials to 401 invalid_credentials", async () => {
    mockedCreatePublicClient.mockReturnValue({
      auth: {
        signInWithPassword: jest
          .fn()
          .mockResolvedValue({ data: { user: null, session: null }, error: { status: 400, message: "Invalid login credentials" } }),
      },
    });

    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(postRequest({ email: "user@example.com", password: "wrongpass" }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_credentials");
  });

  it("returns 400 for malformed bodies", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(postRequest({ email: "not-an-email", password: "" }));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("invalid_request");
  });
});
