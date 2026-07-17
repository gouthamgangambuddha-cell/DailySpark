/** Converts a title into a URL-safe slug, e.g. "How Black Holes Form!" -> "how-black-holes-form" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
