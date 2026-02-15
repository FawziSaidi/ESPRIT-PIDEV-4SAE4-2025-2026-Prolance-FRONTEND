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
  image?: string;
  createAt?: string;
  likes?: number;
  type: TypePublication;
  user?: User;
  commentaires?: any[];
}
