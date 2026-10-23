import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// 1. Refreshes the Supabase session cookie once per navigation (not authorization: pages and RLS check the user).
// 2. Missing or unpublished roles and companies get a real 404 status. Streaming pages can't change their
//    status once they start, so the slug is checked here, as the visitor (admins still reach drafts).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!supabaseUrl || !supabaseKey) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  await supabase.auth.getClaims();

  const match = request.nextUrl.pathname.match(/^\/(opportunities|companies)\/([^/]+)\/?$/);
  if (match) {
    const [, kind, slug] = match;
    const table = kind === "opportunities" ? "opportunity_listing" : "companies";
    const { data, error } = await supabase.from(table).select("id").eq("slug", decodeURIComponent(slug)).maybeSingle();
    // only a clean "not found" becomes a 404; on a database error the page renders and shows its own message
    if (!error && !data) {
      const notFound = NextResponse.rewrite(new URL("/_missing", request.url));
      response.cookies.getAll().forEach((c) => notFound.cookies.set(c));
      return notFound;
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
