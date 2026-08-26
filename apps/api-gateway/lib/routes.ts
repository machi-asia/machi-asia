import { z } from "zod";
import { assertRegistryConsistent, SERVICE_REGISTRY, ServiceDefinition } from "./services";

const upstreamSchema = z.url();

export interface GatewayRoute {
  prefix: string;
  upstream: string;
  requiredRoles: string[];
  isPublic: boolean;
  serviceKey: string;
}

let cached: GatewayRoute[] | null = null;

/**
 * The localhost fallback lets the gateway reach microservices running on this
 * machine during development. It is dev-only by default:
 *   - unset flag + NODE_ENV=production  -> disabled
 *   - unset flag + any other NODE_ENV   -> enabled
 *   - GATEWAY_ALLOW_LOCAL_FALLBACK=true -> forced on everywhere
 *   - GATEWAY_ALLOW_LOCAL_FALLBACK=false-> forced off everywhere
 */
function allowLocalFallback(): boolean {
  const flag = process.env.GATEWAY_ALLOW_LOCAL_FALLBACK;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function resolveUpstream(service: ServiceDefinition): string | null {
  const configured = process.env[service.envVar]?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/, "");
    const parsed = upstreamSchema.safeParse(normalized);
    if (!parsed.success) {
      throw new Error(`${service.envVar} is not a valid URL: "${configured}"`);
    }
    return normalized;
  }

  if (!allowLocalFallback()) {
    // Production without a configured URL: route stays disabled rather than
    // ever proxying to localhost.
    return null;
  }
  return `http://localhost:${service.devPort}`;
}

export function getRoutes(): GatewayRoute[] {
  if (cached) {
    return cached;
  }

  assertRegistryConsistent();

  const routes: GatewayRoute[] = [];
  for (const service of SERVICE_REGISTRY) {
    const upstream = resolveUpstream(service);
    if (!upstream) {
      continue;
    }
    routes.push({
      prefix: normalizePrefix(service.prefix),
      upstream,
      requiredRoles: service.requiredRoles ?? [],
      isPublic: service.isPublic ?? false,
      serviceKey: service.key,
    });
  }

  // Longest prefix wins on overlapping routes.
  routes.sort((a, b) => b.prefix.length - a.prefix.length);

  cached = routes;
  return cached;
}

/** Test hook: clears the memoized route table so env changes are picked up. */
export function resetRoutes(): void {
  cached = null;
}

function normalizePrefix(prefix: string): string {
  const trimmed = prefix.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/**
 * Resolves a request pathname to its configured route using longest-prefix
 * matching. Returns null when no route matches or the service has no
 * reachable upstream (404 at the gateway).
 */
export function resolveRoute(pathname: string): GatewayRoute | null {
  for (const route of getRoutes()) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route;
    }
  }
  return null;
}
