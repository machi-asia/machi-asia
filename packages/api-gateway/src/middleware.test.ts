import { NextRequest, NextResponse } from "next/server";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { resetRoutes } from "./lib/routes";
import { SERVICE_REGISTRY } from "./lib/services";

const ISSUER = "https://test-project.supabase.co/auth/v1";
const AUDIENCE = "authenticated";
let publicJwk: Record<string, unknown>;
let privateKey: CryptoKey;

const ORIGINAL_ENV = { ...process.env };
const ENV = process.env as Record<string, string | undefined>;
const ORIGINAL_REGISTRY = [...SERVICE_REGISTRY];

beforeAll(async () => {
  const { publicKey, privateKey: priv } = await generateKeyPair("ES256");
  privateKey = priv;
  publicJwk = (await exportJWK(publicKey)) as Record<string, unknown>;
});

beforeEach(() => {
  resetRoutes();
  delete ENV.NODE_ENV; // Jest runs with NODE_ENV=test -> fallback active
  process.env.GATEWAY_ALLOW_LOCAL_FALLBACK = "true";

  // Test fixtures through the real registry mechanism.
  SERVICE_REGISTRY.length = 0;
  SERVICE_REGISTRY.push(
    { key: "USERS", prefix: "/api/users", envVar: "USERS_SERVICE_URL", devPort: 4001 },
    { key: "ADMIN", prefix: "/api/admin", envVar: "ADMIN_SERVICE_URL", devPort: 4002, requiredRoles: ["admin"] },
    { key: "PUBLIC", prefix: "/api/public", envVar: "PUBLIC_SERVICE_URL", devPort: 4003, isPublic: true },
  );

  // jose's createRemoteJWKSet fetches the JWKS URL with global fetch. We mock
  // fetch so the middleware exercises real signature verification against a
  // locally generated ES256 key.
  global.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "test-key", use: "sig", alg: "ES256" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
});

afterEach(() => {
  SERVICE_REGISTRY.length = 0;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
  SERVICE_REGISTRY.push(...ORIGINAL_REGISTRY);
});

async function mintToken(overrides: { roles?: string[]; exp?: number; aud?: string } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    email: "user@example.com",
    roles: overrides.roles ?? ["member"],
    session_id: "session-1",
    aal: "aal1",
  })
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setSubject("user-123")
    .setIssuedAt(now)
    .setIssuer(ISSUER)
    .setAudience(overrides.aud ?? AUDIENCE)
    .setExpirationTime(overrides.exp ?? now + 600)
    .sign(privateKey);
}

function requestFor(path: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest(`https://gateway.example${path}`, { headers });
}

async function runMiddleware(path: string, headers: Record<string, string> = {}): Promise<NextResponse> {
  const { gatewayMiddleware } = await import("./middleware");
  return gatewayMiddleware(requestFor(path, headers));
}

/** Reads the request headers Next will hand to the proxy handler. */
function forwardedHeaders(res: NextResponse): Record<string, string> {
  const out: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-middleware-request-")) {
      out[lower.slice("x-middleware-request-".length)] = value;
    }
  });
  return out;
}

describe("middleware", () => {
  it("404s when no route matches (including unconfigured services)", async () => {
    // Simulate production without a configured USERS_SERVICE_URL.
    process.env.GATEWAY_ALLOW_LOCAL_FALLBACK = "false";

    const res = await runMiddleware("/api/users/list");

    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  it("404s unknown prefixes regardless of configuration", async () => {
    const res = await runMiddleware("/api/unknown/path");

    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe("not_found");
  });

  it("401s a protected route without a bearer token", async () => {
    const res = await runMiddleware("/api/users/list");

    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("unauthorized");
  });

  it("401s an invalid token on a protected route", async () => {
    const res = await runMiddleware("/api/users/list", { authorization: "Bearer not-a-jwt" });

    expect(res.status).toBe(401);
  });

  it("injects verified identity headers and the gateway secret", async () => {
    const token = await mintToken({ roles: ["member"] });
    const res = await runMiddleware("/api/users/list", {
      authorization: `Bearer ${token}`,
      "x-gateway-sub": "spoofed-sub",
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");

    const forwarded = forwardedHeaders(res);
    expect(forwarded["x-gateway-sub"]).toBe("user-123"); // spoof replaced by verified sub
    expect(forwarded["x-gateway-email"]).toBe("user@example.com");
    expect(forwarded["x-gateway-roles"]).toBe("member");
    expect(forwarded["x-gateway-secret"]).toBe("test-gateway-secret");
  });

  it("403s when required roles are missing", async () => {
    const token = await mintToken({ roles: ["member"] });
    const res = await runMiddleware("/api/admin/stats", { authorization: `Bearer ${token}` });

    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("forbidden");
  });

  it("allows required-role access when the token carries the role", async () => {
    const token = await mintToken({ roles: ["admin"] });
    const res = await runMiddleware("/api/admin/stats", { authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);
    expect(forwardedHeaders(res)["x-gateway-roles"]).toBe("admin");
  });

  it("passes public routes without a token but still injects the secret", async () => {
    const res = await runMiddleware("/api/public/feed");

    expect(res.status).toBe(200);
    const forwarded = forwardedHeaders(res);
    expect(forwarded["x-gateway-sub"]).toBeUndefined(); // no identity injected
    expect(forwarded["x-gateway-secret"]).toBe("test-gateway-secret");
  });

  it("routes to the env-configured upstream when present", async () => {
    process.env.USERS_SERVICE_URL = "https://users.internal.example";

    const routes = (await import("./lib/routes")).getRoutes();
    expect(routes.find((r) => r.prefix === "/api/users")?.upstream).toBe(
      "https://users.internal.example",
    );
  });
});

describe("gate (pure)", () => {
  it("strips spoofed x-gateway-* headers even for public routes", async () => {
    const { gate } = await import("./lib/auth-gate");
    const publicRoute = (await import("./lib/routes"))
      .getRoutes()
      .find((r) => r.prefix === "/api/public")!;

    const headers = new Headers({
      "x-gateway-sub": "attacker",
      "x-gateway-roles": "superadmin",
    });
    const result = await gate(headers, publicRoute);

    expect(result.ok).toBe(true);
    expect([...headers.keys()].filter((k) => k.startsWith("x-gateway-"))).toEqual([]);
  });

  it("rejects wrong-audience tokens before role checks", async () => {
    const { gate } = await import("./lib/auth-gate");
    const adminRoute = (await import("./lib/routes"))
      .getRoutes()
      .find((r) => r.prefix === "/api/admin")!;
    const token = await mintToken({ aud: "other-audience", roles: ["admin"] });

    const result = await gate(new Headers({ authorization: `Bearer ${token}` }), adminRoute);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });
});
