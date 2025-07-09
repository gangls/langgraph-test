import axios from 'axios';

export interface SearxngSearchOptions {
  categories?: string[];
  engines?: string[];
  language?: string;
  pageno?: number;
  time_range?: 'day' | 'week' | 'month' | 'year'
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
  publishedDate?: string;
  
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const searxngURL = process.env.SEARXNG_URL || 'https://translate.sending.me/';

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      const value = opts[key as keyof SearxngSearchOptions];
      if (value) {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
          return;
        }
        url.searchParams.append(key, value as string);
      }
    });
  }
  try {
    const res = await axios.get(url.toString());

    const results: SearxngSearchResult[] = res.data.results;
    const suggestions: string[] = res.data.suggestions;
  
    return { results, suggestions };
  } catch (e) {
    console.error("[searchSearxng] error: ", e)
    return {
      results: [],
      suggestions: []
    }
  }
};
