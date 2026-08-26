import { exportJWK, generateKeyPair, SignJWT } from "jose";

const ISSUER = "https://test-project.supabase.co/auth/v1";
const AUDIENCE = "authenticated";
let publicJwk: Record<string, unknown>;
let privateKey: CryptoKey;

beforeAll(async () => {
  const { publicKey, privateKey: priv } = await generateKeyPair("ES256");
  privateKey = priv;
  publicJwk = (await exportJWK(publicKey)) as Record<string, unknown>;
});

/**
 * jose's createRemoteJWKSet fetches the JWKS URL with global fetch. We mock
 * fetch so the verifier under test exercises real signature verification
 * against a locally generated ES256 key.
 */
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(
    new Response(JSON.stringify({ keys: [{ ...publicJwk, kid: "test-key", use: "sig", alg: "ES256" }] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ) as unknown as typeof fetch;
});

async function mintToken(overrides: { exp?: number; aud?: string; iss?: string; roles?: unknown } = {}) {
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
    .setIssuer(overrides.iss ?? ISSUER)
    .setAudience(overrides.aud ?? AUDIENCE)
    .setExpirationTime(overrides.exp ?? now + 600)
    .sign(privateKey);
}

describe("verifyAccessToken", () => {
  it("accepts a valid token and maps identity fields", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const token = await mintToken();
    const identity = await verifyAccessToken(token);

    expect(identity.sub).toBe("user-123");
    expect(identity.email).toBe("user@example.com");
    expect(identity.roles).toEqual(["member"]);
    expect(identity.sessionId).toBe("session-1");
    expect(identity.aal).toBe("aal1");
  });

  it("rejects an expired token", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const token = await mintToken({ exp: Math.floor(Date.now() / 1000) - 10 });
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a wrong issuer", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const token = await mintToken({ iss: "https://evil.example.com/auth/v1" });
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a wrong audience", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const token = await mintToken({ aud: "service-role" });
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects tokens signed by an untrusted key", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const other = await generateKeyPair("ES256");
    const now = Math.floor(Date.now() / 1000);
    const forged = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setSubject("user-123")
      .setIssuedAt(now)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setExpirationTime(now + 600)
      .sign(other.privateKey);

    await expect(verifyAccessToken(forged)).rejects.toThrow();
  });

  it("coerces non-array roles to empty array", async () => {
    const { verifyAccessToken } = await import("@/lib/verify");
    const token = await mintToken({ roles: "admin" });
    const identity = await verifyAccessToken(token);
    expect(identity.roles).toEqual([]);
  });
});
