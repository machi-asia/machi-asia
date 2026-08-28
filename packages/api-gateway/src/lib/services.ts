export interface ServiceDefinition {
  /** Uppercase registry key, e.g. "AUTH" — referenced by docs and errors. */
  key: string;
  /** Public path prefix handled by the gateway, e.g. "/api/auth". */
  prefix: string;
  /** Environment variable holding the deployed upstream URL. */
  envVar: string;
  /** Port of the local dev server used by the localhost fallback. */
  devPort: number;
  /** Roles (from the JWT roles claim) required for any path below prefix. */
  requiredRoles?: string[];
  /** Skip token verification for this service's paths. */
  isPublic?: boolean;
}

/**
 * Gateway-owned endpoints that sit under /api and must never be shadowed by a
 * registered service. The middleware matcher excludes them, so a colliding
 * prefix would silently never match.
 */
export const RESERVED_PREFIXES = ["/api/health", "/api/usage"];

/**
 * Catalog of known machi-asia microservices. Structural config lives here;
 * deployment-specific URLs live in environment variables named by `envVar`.
 *
 * To onboard a microservice:
 *   1. Add an entry below (prefix, env var, local dev port, roles).
 *   2. Set `<KEY>_SERVICE_URL` on the gateway deployment (prod/staging).
 *   3. Locally, just run the service on its dev port — the gateway finds it.
 */
export const SERVICE_REGISTRY: ServiceDefinition[] = [
  {
    key: "AUTH",
    prefix: "/api/auth",
    envVar: "AUTH_SERVICE_URL",
    devPort: 4000,
  },
  {
    key: "ROSE",
    prefix: "/api/rose",
    envVar: "ROSE_SERVICE_URL",
    devPort: 5000,
  },
  {
    key: "MEDIA",
    prefix: "/api/media-library",
    envVar: "MEDIA_SERVICE_URL",
    devPort: 6100,
  },
];

/** Throws when two services collide on key, prefix, or env var name. */
export function assertRegistryConsistent(
  registry: ServiceDefinition[] = SERVICE_REGISTRY,
): void {
  const seen = new Set<string>();
  for (const svc of registry) {
    for (const [kind, value] of [
      ["key", svc.key],
      ["prefix", svc.prefix],
      ["envVar", svc.envVar],
    ] as const) {
      const identity = `${kind}=${value}`;
      if (seen.has(identity)) {
        throw new Error(`Duplicate service ${identity} in SERVICE_REGISTRY`);
      }
      seen.add(identity);
    }

    const normalized = svc.prefix.replace(/\/+$/, "") || "/";
    if (RESERVED_PREFIXES.some((reserved) => normalized === reserved || normalized.startsWith(`${reserved}/`))) {
      throw new Error(
        `Service ${svc.key} uses reserved gateway prefix "${normalized}" (${RESERVED_PREFIXES.join(", ")})`,
      );
    }
  }
}
