import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns ok with service name", async () => {
    const res = GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("machi-asia-auth");
    expect(typeof json.timestamp).toBe("string");
  });
});
