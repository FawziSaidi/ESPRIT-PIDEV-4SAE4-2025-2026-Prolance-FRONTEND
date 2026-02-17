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
  // ✅ MULTI-IMAGES : tableau de noms de fichiers
  images?: string[];
  createAt?: string;
  likes?: number;
  type: TypePublication;
  user?: User;
  commentaires?: any[];
}

// ✅ Helper pour construire l'URL d'une image
export function getImageUrl(imageName: string): string {
  return `http://localhost:8089/pidev/uploads/publications/${imageName}`;
}
