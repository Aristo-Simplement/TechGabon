import { profileHandlers } from '@/lib/profileApi';
import { professionalInput, publicProfessional } from '@/lib/records';
import { scoreProfessional } from '@/lib/scoring';

export const { DELETE } = profileHandlers({
  table: 'professionals',
  kind: 'pro',
  input: professionalInput,
  publicView: publicProfessional,
  score: scoreProfessional,
  displayName: (r) => r.prenom,
});
