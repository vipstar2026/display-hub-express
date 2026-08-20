import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

function isClientDisconnectError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = (error as { cause?: unknown }).cause;
  const message = `${error.message} ${cause instanceof Error ? cause.message : ""}`.toLowerCase();
  const code = (error as { code?: string }).code ??
    (cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : undefined);
  return (
    message.includes("aborted") ||
    message.includes("socket hang up") ||
    message.includes("econnreset") ||
    code === "ECONNRESET" ||
    code === "ECONNABORTED" ||
    code === "ERR_ABORTED"
  );
}

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/lovable/") || url.pathname === "/email/unsubscribe") {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (isClientDisconnectError(error)) {
      return new Response(null, { status: 499, headers: { "content-length": "0" } });
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware],
}));
