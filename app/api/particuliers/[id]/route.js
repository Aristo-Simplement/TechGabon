import { profileHandlers } from '@/lib/profileApi';
import { particulierInput } from '@/lib/records';

export const { DELETE } = profileHandlers({
  table: 'particuliers',
  kind: 'particulier',
  input: particulierInput,
  publicView: () => null,
  score: () => ({ score: undefined }),
  displayName: (r) => r.prenom,
});
