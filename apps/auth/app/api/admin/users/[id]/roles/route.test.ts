import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  createAdminClient: jest.fn(),
}));

const mockedCreateAdminClient = createAdminClient as jest.Mock;

function patchRequest(body: unknown, secret?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) headers["x-admin-secret"] = secret;
  return new NextRequest("http://localhost:4000/api/admin/users/11111111-2222-3333-4444-555555555555/roles", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

async function callRoute(req: NextRequest) {
  const { PATCH } = await import("@/app/api/admin/users/[id]/roles/route");
  return PATCH(req, { params: Promise.resolve({ id: "11111111-2222-3333-4444-555555555555" }) });
}

describe("PATCH /api/admin/users/:id/roles", () => {
  afterEach(() => jest.resetAllMocks());

  it("rejects requests without the admin secret", async () => {
    const res = await callRoute(patchRequest({ roles: ["admin"] }));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error.code).toBe("unauthorized");
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });

  it("rejects an incorrect admin secret", async () => {
    const res = await callRoute(patchRequest({ roles: ["admin"] }, "wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("updates app_metadata roles and returns the result", async () => {
    mockedCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          updateUserById: jest.fn().mockResolvedValue({
            data: { user: { id: "user-123", email: "user@example.com" } },
            error: null,
          }),
        },
      },
    });

    const res = await callRoute(patchRequest({ roles: ["admin", "billing-manager"] }, "test-admin-secret"));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.roles).toEqual(["admin", "billing-manager"]);

    const client = mockedCreateAdminClient.mock.results[0].value;
    expect(client.auth.admin.updateUserById).toHaveBeenCalledWith(
      "11111111-2222-3333-4444-555555555555",
      { app_metadata: { roles: ["admin", "billing-manager"] } },
    );
  });

  it("returns 404 when the user does not exist", async () => {
    mockedCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          updateUserById: jest
            .fn()
            .mockResolvedValue({ data: null, error: { status: 404, message: "User not found" } }),
        },
      },
    });

    const res = await callRoute(patchRequest({ roles: ["admin"] }, "test-admin-secret"));

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error.code).toBe("not_found");
  });

  it("returns 400 for invalid role names", async () => {
    const res = await callRoute(patchRequest({ roles: ["has spaces!"] }, "test-admin-secret"));

    expect(res.status).toBe(400);
    expect(mockedCreateAdminClient).not.toHaveBeenCalled();
  });
});
