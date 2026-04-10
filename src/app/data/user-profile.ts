export const currentUserProfile = {
  displayName: "John Doe",
  email: "john.doe@company.com",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getFirstName(name: string): string {
  const [first] = name.trim().split(/\s+/).filter(Boolean);
  return first || "there";
}
