import { User } from './publication.model';

export interface Commentaire {
  id?: number;
  contenue: string;
  createAt?: string;
  likes?: number;
  user?: User;
  publicationId?: number;
}
