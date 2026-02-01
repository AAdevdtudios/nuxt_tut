export interface Category {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Explore {
  id: number;
  documentId: string;
  Title: string;
  Description: string;
  Downloads: string;
  Copyright: string;
  url: string;
  slug: string;
  Language: string;
  Author: string;
}
