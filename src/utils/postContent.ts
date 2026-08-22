type StoredPostContent = {
  title?: unknown;
  body?: unknown;
};

const trailingEncodedSpaces = /(?:\s|&(?:#x0*20|#0*32|nbsp);)+$/giu;

/**
 * Converts the JSON payload used by community posts into readable text while
 * preserving legacy posts that were stored as plain text.
 */
export const getPostDisplayText = (rawContent: string | null | undefined) => {
  if (!rawContent) return '';

  const normalizedContent = rawContent.trim().replace(trailingEncodedSpaces, '');

  try {
    const parsed = JSON.parse(normalizedContent) as StoredPostContent;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && ('body' in parsed || 'title' in parsed)) {
      const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const body = typeof parsed.body === 'string' ? parsed.body.trim() : '';

      return [title, body].filter(Boolean).join('\n');
    }
  } catch {
    // Legacy posts are stored as plain text rather than JSON.
  }

  return rawContent;
};
