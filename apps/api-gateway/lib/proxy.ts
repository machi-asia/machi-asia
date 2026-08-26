import { resolveRoute } from "@/lib/routes";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "trailers",
]);

// Headers never forwarded upstream: hop-by-hop, plus ones the gateway owns.
const REQUEST_STRIP = new Set([
  ...HOP_BY_HOP,
  "host",
  "content-length",
  // The bearer token has already been verified; identity travels via
  // x-gateway-* headers instead of replaying the credential upstream.
  "authorization",
  // Dropped so the upstream responds with an encoding we can stream untouched.
  "accept-encoding",
]);

// Response-side strip: hop-by-hop plus framing the runtime re-computes.
const RESPONSE_STRIP = new Set([...HOP_BY_HOP, "content-length", "content-encoding"]);

/**
 * Maps a gateway pathname onto its upstream URL: strips the route prefix,
 * keeps the remaining path and query string. Returns null when unmatched.
 */
export function buildUpstreamUrl(pathname: string, search: string): string | null {
  const route = resolveRoute(pathname);
  if (!route) {
    return null;
  }
  const rest = pathname.slice(route.prefix.length);
  return `${route.upstream}${rest}${search}`;
}

export function buildUpstreamRequestHeaders(requestHeaders: Headers): Headers {
  const out = new Headers();
  requestHeaders.forEach((value, key) => {
    // x-gateway-* headers pass through: middleware strips any inbound ones
    // before injecting verified identity plus the internal secret.
    if (!REQUEST_STRIP.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });
  return out;
}

export function buildResponseHeaders(upstreamHeaders: Headers): Headers {
  const out = new Headers();
  upstreamHeaders.forEach((value, key) => {
    if (!RESPONSE_STRIP.has(key.toLowerCase())) {
      out.set(key, value);
    }
  });
  return out;
}
