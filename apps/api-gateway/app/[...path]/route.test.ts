import { NextRequest } from "next/server";
import { resetRoutes } from "@/lib/routes";
import { SERVICE_REGISTRY } from "@/lib/services";
import { buildUpstreamUrl } from "@/lib/proxy";

jest.mock("@/lib/proxy", () => {
  const actual = jest.requireActual<typeof import("@/lib/proxy")>("@/lib/proxy");
  return {
    ...actual,
    buildUpstreamUrl: jest.fn(),
  };
});

const mockedBuildUpstreamUrl = buildUpstreamUrl as jest.Mock;

function requestFor(method: string, path: string, body?: string): NextRequest {
  return new NextRequest(`https://gateway.example${path}`, {
    method,
    headers: { "content-type": "application/json", "x-gateway-sub": "user-1" },
    body,
  });
}

describe("proxy handler", () => {
  beforeEach(() => {
    resetRoutes();
    SERVICE_REGISTRY.length = 0;
    SERVICE_REGISTRY.push({
      key: "USERS",
      prefix: "/api/users",
      envVar: "USERS_SERVICE_URL",
      devPort: 4001,
    });
  });

  afterEach(() => jest.resetAllMocks());

  it("streams a POST body to the resolved upstream and relays the response", async () => {
    mockedBuildUpstreamUrl.mockReturnValue("https://users.internal/create");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ created: true }), {
        status: 201,
        headers: { "content-type": "application/json", "x-request-id": "abc" },
      }),
    ) as unknown as typeof fetch;

    const { POST } = await import("@/app/[...path]/route");
    const res = await POST(requestFor("POST", "/api/users/create", JSON.stringify({ name: "x" })));

    expect(res.status).toBe(201);
    expect(res.headers.get("x-request-id")).toBe("abc");
    await expect(res.json()).resolves.toEqual({ created: true });

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://users.internal/create");
    expect(init.method).toBe("POST");
    expect((init.headers as Headers).get("x-gateway-sub")).toBe("user-1");
  });

  it("404s when no upstream resolves", async () => {
    mockedBuildUpstreamUrl.mockReturnValue(null);

    const { GET } = await import("@/app/[...path]/route");
    const res = await GET(requestFor("GET", "/api/nothing"));

    expect(res.status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("502s when the upstream is unreachable", async () => {
    mockedBuildUpstreamUrl.mockReturnValue("https://users.internal/dead");
    global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED")) as unknown as typeof fetch;
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    const { GET } = await import("@/app/[...path]/route");
    const res = await GET(requestFor("GET", "/api/users/dead"));

    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe("upstream_error");
  });
});
