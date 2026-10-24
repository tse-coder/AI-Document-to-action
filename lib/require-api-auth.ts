import { auth } from "@clerk/nextjs/server";

/**
 * Returns the Clerk userId if authenticated, or null for guest requests.
 */
export async function getOptionalUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Optional API auth guard: does not reject guest requests with 401,
 * allowing guests to access sample/guest data and authenticated users to access their own data.
 */
export async function requireApiAuth() {
  return null;
}
