export enum TypePublication {
  QUESTION = 'QUESTION',
  ARTICLE = 'ARTICLE',
  REVIEW = 'REVIEW'
}

export interface User {
  id: number;
  name: string;
  lastName: string;
  role?: string;
}

export interface Publication {
  id?: number;
  titre: string;
  contenue: string;
  images?: string[];
  pdfs?: string[];
  createAt?: string;
  type: TypePublication;
  user?: User;
  commentaires?: any[];
  titleColor?: string;
  contentColor?: string;
  titleFontSize?: string;
}

// ✅ Helper to build an image URL
export function getImageUrl(imageName: string): string {
  return `http://localhost:8222/uploads/publications/${imageName}`;
}

// ✅ Helper to build a PDF URL
export function getPdfUrl(pdfName: string): string {
  return `http://localhost:8222/uploads/publications/${pdfName}`;
}