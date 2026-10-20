export const MAX_PASSWORD_BYTES = 72;

/** BCrypt limits the UTF-8 bytes of a new password, rather than its character count. */
export function isPasswordWithinByteLimit(password: string): boolean {
  return new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES;
}
