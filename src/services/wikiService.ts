
import { API_BASE_URL } from '../utils';
import { WikiPage, WikiSearchResultItem } from '../types';

export const searchWikiPages = async (query: string): Promise<WikiSearchResultItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/wiki/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to search wiki pages' }));
    throw new Error(errorData.error || 'Failed to search wiki pages');
  }
  return response.json();
};

export const getWikiPageById = async (id: string): Promise<WikiPage> => {
  const response = await fetch(`${API_BASE_URL}/api/wiki/${id}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `Failed to fetch page ${id}` }));
    throw new Error(errorData.error || `Failed to fetch page ${id}`);
  }
  return response.json();
};

export const upsertWikiPage = async (pageData: { title: string; content_md: string; id?: string }): Promise<WikiPage> => {
  const response = await fetch(`${API_BASE_URL}/api/wiki`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pageData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to save wiki page' }));
    throw new Error(errorData.error || 'Failed to save wiki page');
  }
  return response.json();
};

export const listSampleWikiPages = async (): Promise<WikiSearchResultItem[]> => {
  const response = await fetch(`${API_BASE_URL}/api/wiki`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to list sample wiki pages' }));
    throw new Error(errorData.error || 'Failed to list sample wiki pages');
  }
  return response.json();
};
