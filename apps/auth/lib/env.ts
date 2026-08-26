const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL").replace(/\/+$/, "");
  },
  get supabasePublishableKey() {
    return required("SUPABASE_PUBLISHABLE_KEY");
  },
  get supabaseServiceRoleSecret() {
    return required("SUPABASE_SERVICE_ROLE_SECRET");
  },
  get adminApiSecret() {
    return required("ADMIN_API_SECRET");
  },
};
