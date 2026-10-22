import { profileHandlers } from '@/lib/profileApi';
import { particulierInput } from '@/lib/records';

// Accounts of private individuals. Their details are never listed publicly (no GET): only
// the owner sees them, through /api/auth/me.
const api = profileHandlers({
  table: 'particuliers',
  kind: 'particulier',
  input: particulierInput,
  publicView: () => null,
  score: () => ({ score: undefined }),
  displayName: (r) => r.prenom,
});

export const { POST } = api;
