import { resetRoutes } from "../routes";
import { SERVICE_REGISTRY } from "../services";
import { buildResponseHeaders, buildUpstreamRequestHeaders, buildUpstreamUrl } from "../proxy";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  resetRoutes();
  SERVICE_REGISTRY.length = 0;
  SERVICE_REGISTRY.push({
    key: "USERS",
    prefix: "/api/users",
    envVar: "USERS_SERVICE_URL",
    devPort: 4001,
  });
  process.env.USERS_SERVICE_URL = "https://users.internal";
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe("buildUpstreamUrl", () => {
  it("forwards the full path unchanged to the upstream", () => {
    expect(buildUpstreamUrl("/api/users/42/orders", "?limit=5")).toBe(
      "https://users.internal/api/users/42/orders?limit=5",
    );
  });

  it("maps the bare prefix to the upstream with the prefix preserved", () => {
    expect(buildUpstreamUrl("/api/users", "")).toBe("https://users.internal/api/users");
  });

  it("returns null when unmatched", () => {
    expect(buildUpstreamUrl("/unknown", "")).toBeNull();
  });
});

describe("buildUpstreamRequestHeaders", () => {
  it("drops gateway-owned, framing, and credential headers", () => {
    const input = new Headers({
      host: "gateway.example",
      "content-length": "123",
      authorization: "Bearer secret-token",
      "accept-encoding": "gzip, br",
      connection: "keep-alive",
      "content-type": "application/json",
      "user-agent": "test-client/1.0",
      "x-gateway-sub": "user-1",
      "x-gateway-secret": "internal-secret",
    });

    const out = buildUpstreamRequestHeaders(input);

    expect(out.get("host")).toBeNull();
    expect(out.get("content-length")).toBeNull();
    expect(out.get("authorization")).toBeNull(); // never replayed upstream
    expect(out.get("accept-encoding")).toBeNull();
    expect(out.get("connection")).toBeNull();

    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("user-agent")).toBe("test-client/1.0");
    // Verified identity and internal secret flow through:
    expect(out.get("x-gateway-sub")).toBe("user-1");
    expect(out.get("x-gateway-secret")).toBe("internal-secret");
  });
});

describe("buildResponseHeaders", () => {
  it("keeps payload headers and drops hop-by-hop/framing headers", () => {
    const upstream = new Headers({
      "content-type": "application/json",
      "content-length": "999",
      "content-encoding": "br",
      connection: "close",
      "x-request-id": "abc",
    });

    const out = buildResponseHeaders(upstream);

    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("x-request-id")).toBe("abc");
    expect(out.get("content-length")).toBeNull();
    expect(out.get("content-encoding")).toBeNull();
    expect(out.get("connection")).toBeNull();
  });
});
