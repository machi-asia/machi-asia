import { getRoutes, resetRoutes, resolveRoute } from "../routes";
import { assertRegistryConsistent, RESERVED_PREFIXES, SERVICE_REGISTRY, ServiceDefinition } from "../services";

const ORIGINAL_ENV = { ...process.env };
const ENV = process.env as Record<string, string | undefined>;

beforeEach(() => {
  resetRoutes();
  delete ENV.NODE_ENV; // Jest runs with NODE_ENV=test -> fallback active by default
  delete process.env.AUTH_SERVICE_URL;
  delete process.env.GATEWAY_ALLOW_LOCAL_FALLBACK;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("localhost fallback", () => {
  it("falls back to localhost:<devPort> outside production when env is unset", () => {
    delete ENV.NODE_ENV; // Jest runs with NODE_ENV=test

    const auth = resolveRoute("/api/auth/login");
    expect(auth?.upstream).toBe("http://localhost:4000");
  });

  it("disables the route in production when env is unset (never proxies to localhost)", () => {
    ENV.NODE_ENV = "production";

    expect(resolveRoute("/api/auth/login")).toBeNull();
  });

  it("forces the fallback on in production via GATEWAY_ALLOW_LOCAL_FALLBACK=true", () => {
    ENV.NODE_ENV = "production";
    process.env.GATEWAY_ALLOW_LOCAL_FALLBACK = "true";

    expect(resolveRoute("/api/auth")?.upstream).toBe("http://localhost:4000");
  });

  it("hard-disables the fallback in dev via GATEWAY_ALLOW_LOCAL_FALLBACK=false", () => {
    delete ENV.NODE_ENV;
    process.env.GATEWAY_ALLOW_LOCAL_FALLBACK = "false";

    expect(resolveRoute("/api/auth")).toBeNull();
  });
});

describe("env-configured upstreams", () => {
  it("prefers the service URL env var over the fallback and normalizes trailing slashes", () => {
    process.env.AUTH_SERVICE_URL = "https://auth.internal.example/";

    const auth = resolveRoute("/api/auth/user");
    expect(auth?.upstream).toBe("https://auth.internal.example");
  });

  it("wins even in production without any fallback flags", () => {
    ENV.NODE_ENV = "production";
    process.env.AUTH_SERVICE_URL = "https://auth.internal.example";

    expect(resolveRoute("/api/auth")?.upstream).toBe("https://auth.internal.example");
  });

  it("throws a loud, variable-naming error for invalid URLs", () => {
    process.env.AUTH_SERVICE_URL = "not-a-url";

    expect(() => getRoutes()).toThrow(/AUTH_SERVICE_URL is not a valid URL/);
  });
});

describe("resolveRoute matching (unchanged semantics)", () => {
  it("matches exact prefix and nested paths but not sibling prefixes", () => {
    expect(resolveRoute("/api/auth")?.upstream).toBe("http://localhost:4000");
    expect(resolveRoute("/api/auth/deep/path?x=1")?.prefix).toBe("/api/auth");
    expect(resolveRoute("/api/authentication")).toBeNull();
    expect(resolveRoute("/api/health")).toBeNull();
  });
});

describe("assertRegistryConsistent", () => {
  const base: ServiceDefinition = {
    key: "A",
    prefix: "/a",
    envVar: "A_SERVICE_URL",
    devPort: 4001,
  };

  it("accepts a clean registry", () => {
    expect(() => assertRegistryConsistent([base])).not.toThrow();
  });

  it.each([
    ["key", { ...base, prefix: "/b", envVar: "B_SERVICE_URL" }],
    ["prefix", { ...base, key: "B", envVar: "B_SERVICE_URL" }],
    ["envVar", { ...base, key: "B", prefix: "/b" }],
  ])("rejects duplicate %s", (_kind, duplicate) => {
    expect(() => assertRegistryConsistent([base, duplicate])).toThrow(/Duplicate service/);
  });

  it.each(RESERVED_PREFIXES)("rejects reserved gateway prefix %s", (reserved) => {
    expect(() =>
      assertRegistryConsistent([{ key: "X", prefix: `${reserved}/v2`, envVar: "X_SERVICE_URL", devPort: 4010 }]),
    ).toThrow(/reserved gateway prefix/);
  });
});

describe("registry integrity", () => {
  it("keeps prefixes and env var names unique across entries", () => {
    expect(() => assertRegistryConsistent(SERVICE_REGISTRY)).not.toThrow();
  });
});
