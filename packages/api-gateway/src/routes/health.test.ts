import { GET } from "./health";

describe("GET /api/health", () => {
  it("returns ok with service name", async () => {
    const res = GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("machi-asia-api-gateway");
    expect(typeof json.timestamp).toBe("string");
  });
});
