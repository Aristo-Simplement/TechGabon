import { profileHandlers } from '@/lib/profileApi';
import { companyInput, publicCompany } from '@/lib/records';
import { scoreCompany } from '@/lib/scoring';

export const { DELETE } = profileHandlers({
  table: 'companies',
  kind: 'company',
  input: companyInput,
  publicView: publicCompany,
  score: (r) => scoreCompany(r),
  displayName: (r) => r.nom,
});
