export function normalizeUpstreamUrl(url: string): string {
  return url.replace(/^https?:\/\/[^/]+\/api/, '').replace(/^\/api/, '');
}
