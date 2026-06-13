// Pure helpers for interpreting Subsonic API responses — kept free of
// stores and fetch so they can be unit-tested directly.

// Thrown when the server rejects the request's credentials (error code 40:
// "Wrong username or password"). Callers use this to distinguish a stale
// password from other API errors (not found, server error, etc).
export class AuthError extends Error {}

// Subsonic responses are always HTTP 200 with a `status` field. Returns the
// response body on success, or throws AuthError / Error on failure.
export function parseSubsonicResponse(root) {
  if (root.status !== 'failed') return root
  const message = root.error?.message ?? 'Subsonic error'
  if (root.error?.code === 40) throw new AuthError(message)
  throw new Error(message)
}
