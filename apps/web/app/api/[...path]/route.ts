import type { NextRequest } from "next/server";

// Proxy /api/* to the NestJS backend. A route handler (rather than a
// next.config rewrite) so API_URL is read at runtime, not baked into the build.
const apiUrl = () => process.env.API_URL ?? "http://127.0.0.1:3001";

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const target = new URL(`${apiUrl()}/api/${path.join("/")}`);
  target.search = req.nextUrl.search;

  const res = await fetch(target, {
    method: req.method,
    headers: { "content-type": req.headers.get("content-type") ?? "application/json" },
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    cache: "no-store",
  });

  const body = res.status === 204 ? null : await res.text();
  return new Response(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
