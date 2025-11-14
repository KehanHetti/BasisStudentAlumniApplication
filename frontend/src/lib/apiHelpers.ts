export function extractArrayFromResponse<T>(data: T[] | { results: T[] } | T): T[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'results' in data) {
    return (data as { results: T[] }).results;
  }
  return [];
}

