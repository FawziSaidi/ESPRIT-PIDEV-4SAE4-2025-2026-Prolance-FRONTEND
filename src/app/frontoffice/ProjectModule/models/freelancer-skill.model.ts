export interface FreelancerSkill {
  id?: number;

  skillName: string;
  description: string;

  level: string;           // si tu as un enum côté backend
  yearsExperience: number;
  availability: string;    // enum probable

}
