process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? "https://test-project.supabase.co";
process.env.INTERNAL_GATEWAY_SECRET = process.env.INTERNAL_GATEWAY_SECRET ?? "test-gateway-secret";
delete process.env.AUTH_SERVICE_URL;
delete process.env.GATEWAY_ALLOW_LOCAL_FALLBACK;
