

export enum InscriptionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum ParticipantRole {
  VISITEUR = 'VISITEUR',
  PARTICIPANT = 'PARTICIPANT',
  SPEAKER = 'SPEAKER',
  ANIMATOR = 'ANIMATOR',
  EXPERT = 'EXPERT'
}

export enum Domaine {
  DEVELOPMENT = 'DEVELOPMENT',
  DESIGN = 'DESIGN'
}

export interface EventInscriptionRequestDTO {
  participantNom: string;
  participantPrenom: string;
  demaine: Domaine;
  participantRole: ParticipantRole;
  message?: string;
  userId: number;
  eventId: number;
}

export interface EventInscriptionResponseDTO {
  id: number;
  participantNom: string;
  participantPrenom: string;
  registrationDate: string;
  domaine: Domaine;
  participantRole: ParticipantRole;
  imageUrl: string;
  message: string;
  status: InscriptionStatus;
  badgeImagePath: string;
  userId: number;
  eventId: number;
  eventTitle: string;
}