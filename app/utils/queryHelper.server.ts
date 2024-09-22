export function isValidObjectId(id: string): boolean {
  // Check if the string is exactly 24 characters long
  // and contains only hexadecimal characters
  return /^[0-9a-fA-F]{24}$/.test(id);
}
