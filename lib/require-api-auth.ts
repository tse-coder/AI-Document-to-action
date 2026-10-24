import { auth } from "@clerk/nextjs/server";
import { apiError } from "./api-response";

/** Require a Clerk session for a private API route. */
export async function requireApiAuth() {
  const { isAuthenticated } = await auth();
  if (isAuthenticated) return null;

  return apiError("UNAUTHENTICATED", "Sign in to use this endpoint.", 401);
}
