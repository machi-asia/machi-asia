jest.mock("@/lib/supabase", () => ({
  getSupabase: jest.fn(),
}));

import { getSupabase } from "@/lib/supabase";
import { currentWeek } from "@/lib/usage";

const mockedGetSupabase = getSupabase as jest.Mock;

function mockQueryChain(result: { data: unknown; error: unknown; count?: number } = { data: null, error: null }) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(result),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue(result),
  };
  return chain;
}

describe("currentWeek", () => {
  it("returns a string in YYYY-Wxx format", () => {
    const week = currentWeek();
    expect(week).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("returns the correct week for a known date", () => {
    const mockDate = new Date("2026-01-05T12:00:00Z"); // A Monday in week 2
    const realDate = Date;
    const MockDate = function (...args: unknown[]) {
      if (args.length === 0) {
        return new realDate(mockDate.getTime());
      }
      return new realDate(...(args as ConstructorParameters<typeof Date>));
    } as unknown as typeof Date;
    MockDate.now = () => mockDate.getTime();
    global.Date = MockDate;

    const week = currentWeek();
    expect(week).toMatch(/^2026-W/);

    global.Date = realDate;
  });
});

describe("checkAndIncrementUsage", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns allowed=true and count=1 when no existing row", async () => {
    const chain = mockQueryChain({ data: null, error: { code: "PGRST116" } });
    // Second call (insert) succeeds
    chain.insert.mockResolvedValue({ data: null, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { checkAndIncrementUsage } = await import("@/lib/usage");
    const result = await checkAndIncrementUsage("user-1");

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(1);
    expect(result.week).toBe(currentWeek());
  });

  it("increments count when under the limit", async () => {
    const chain = mockQueryChain({ data: { count: 5, limit: 1000 }, error: null });
    chain.update.mockReturnThis();
    chain.single.mockResolvedValue({ data: { count: 6 }, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { checkAndIncrementUsage } = await import("@/lib/usage");
    const result = await checkAndIncrementUsage("user-2");

    expect(result.allowed).toBe(true);
    expect(result.count).toBe(6);
  });

  it("returns allowed=false when at the limit", async () => {
    const chain = mockQueryChain({ data: { count: 1000, limit: 1000 }, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { checkAndIncrementUsage } = await import("@/lib/usage");
    const result = await checkAndIncrementUsage("user-3");

    expect(result.allowed).toBe(false);
    expect(result.count).toBe(1000);
    expect(result.limit).toBe(1000);
  });

  it("returns allowed=false when over the limit", async () => {
    const chain = mockQueryChain({ data: { count: 1001, limit: 1000 }, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { checkAndIncrementUsage } = await import("@/lib/usage");
    const result = await checkAndIncrementUsage("user-4");

    expect(result.allowed).toBe(false);
  });
});

describe("getUsage", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns zero usage when no row exists", async () => {
    const chain = mockQueryChain({ data: null, error: { code: "PGRST116" } });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { getUsage } = await import("@/lib/usage");
    const result = await getUsage("user-new");

    expect(result.count).toBe(0);
    expect(result.allowed).toBe(true);
  });

  it("returns current usage when row exists", async () => {
    const chain = mockQueryChain({ data: { count: 42, limit: 1000 }, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { getUsage } = await import("@/lib/usage");
    const result = await getUsage("user-active");

    expect(result.count).toBe(42);
    expect(result.limit).toBe(1000);
    expect(result.allowed).toBe(true);
  });

  it("returns allowed=false when at the limit", async () => {
    const chain = mockQueryChain({ data: { count: 1000, limit: 1000 }, error: null });
    mockedGetSupabase.mockReturnValue({ from: jest.fn().mockReturnValue(chain) });

    const { getUsage } = await import("@/lib/usage");
    const result = await getUsage("user-full");

    expect(result.allowed).toBe(false);
  });
});
