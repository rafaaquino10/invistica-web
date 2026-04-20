import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error_description") ?? searchParams.get("error");

  if (errorParam) {
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", errorParam);
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", "code_missing");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const redirectUrl = new URL("/", origin);
      redirectUrl.searchParams.set("auth_error", error.message);
      return NextResponse.redirect(redirectUrl);
    }

    // TODO: quando `/app` existir, trocar o default de `next` para `/app`.
    return NextResponse.redirect(new URL(next, origin));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido na autenticação";
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set("auth_error", message);
    return NextResponse.redirect(redirectUrl);
  }
}
