export function formatProcessedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
