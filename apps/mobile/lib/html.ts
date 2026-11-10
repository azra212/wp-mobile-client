/** Remove tags so a WordPress excerpt can be shown as plain text. */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}
