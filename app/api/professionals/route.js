import { profileHandlers } from '@/lib/profileApi';
import { professionalInput, publicProfessional } from '@/lib/records';
import { scoreProfessional } from '@/lib/scoring';

const api = profileHandlers({
  table: 'professionals',
  kind: 'pro',
  input: professionalInput,
  publicView: publicProfessional,
  score: scoreProfessional,
  displayName: (r) => r.prenom,
});

export const { GET, POST } = api;
