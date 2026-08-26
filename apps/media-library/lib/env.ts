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
  get supabaseServiceRoleSecret() {
    return required("SUPABASE_SERVICE_ROLE_SECRET");
  },
  get supabaseAnonKey() {
    return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get mediaStorageBucket() {
    return process.env["MEDIA_STORAGE_BUCKET"] ?? "media";
  },
};
