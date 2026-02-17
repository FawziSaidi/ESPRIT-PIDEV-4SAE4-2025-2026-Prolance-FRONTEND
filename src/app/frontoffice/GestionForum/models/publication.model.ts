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
  pdfs?: string[];        // ✅ PDF file names
  createAt?: string;
  likes?: number;
  type: TypePublication;
  user?: User;
  commentaires?: any[];
}

// ✅ Helper to build an image URL
export function getImageUrl(imageName: string): string {
  return `http://localhost:8089/pidev/uploads/publications/${imageName}`;
}

// ✅ Helper to build a PDF URL
export function getPdfUrl(pdfName: string): string {
  return `http://localhost:8089/pidev/uploads/publications/${pdfName}`;
}