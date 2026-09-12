import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export function client() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url || !process.env.WORKSPACE_SECRET) throw new Error("Workspace is not configured");
  return new ConvexHttpClient(url);
}
export function secret() { return process.env.WORKSPACE_SECRET!; }
export function sign(value: string) { return createHmac("sha256", secret()).update(value).digest("hex"); }
export function safeEqual(a: string, b: string) { const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length && timingSafeEqual(x,y); }
export async function authorized() {
  // The default scripts bind only to loopback. For network use, turn this off and set STAGE_ACCESS_CODE.
  if (process.env.STAGE_LOCAL_ONLY === "true" && !process.env.VERCEL) return true;
  const token = (await cookies()).get("stage_session")?.value;
  if (!token || !process.env.STAGE_ACCESS_CODE || !process.env.WORKSPACE_SECRET) return false;
  const [expiry, signature] = token.split(".");
  return Number(expiry)>Date.now() && safeEqual(sign(expiry),signature || "");
}
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") || "");
    // Next may normalize request.url to localhost behind its server adapter.
    return ["https:", "http:"].includes(origin.protocol) && origin.host === request.headers.get("host");
  } catch { return false; }
}
export const privateHeaders = { "Cache-Control": "private, no-store" };
