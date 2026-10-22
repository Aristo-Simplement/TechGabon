import { listRecords, getRecord, saveRecord, deleteRecord, deleteAccount, findAccountByRecord, TABLE_OF_KIND, KIND_OF_TABLE } from '@/lib/db';
import { deleteUnusedFiles } from '@/lib/files';

// Deleting an account removes everything attached to it: its profile, its private
// documents and the requests it published. Used when people delete their own account and
// by the platform owner's moderation space.
export async function deleteAccountData(account) {
  const table = TABLE_OF_KIND[account.kind];
  const record = table ? await getRecord(table, account.record_id) : null;
  if (record) {
    await deleteRecord(table, record.id);
    await deleteUnusedFiles(record.docs, null);
  }
  for (const m of await listRecords('missions')) {
    if (m.ownerAccountId === account.id) await deleteRecord('missions', m.id);
  }
  await deleteAccount(account.id);
}

// Moderation: delete a record — and, for a profile, the account that owns it.
export async function deleteAnyRecord(table, id) {
  if (table === 'missions') {
    await deleteRecord('missions', id);
    return;
  }
  const account = await findAccountByRecord(id);
  if (account && KIND_OF_TABLE[table] === account.kind) {
    await deleteAccountData(account);
    return;
  }
  const record = await getRecord(table, id); // demo / legacy profile without an account
  if (record) {
    await deleteRecord(table, id);
    await deleteUnusedFiles(record.docs, null);
  }
}

// Moderation: hide a profile or request from visitors (or show it again). The owner
// still sees it in their own space, with a notice.
export async function setHidden(table, id, hidden, by) {
  const record = await getRecord(table, id);
  if (!record) return null;
  const updated = { ...record, hidden: !!hidden, moderation: hidden ? { hiddenAt: new Date().toISOString(), by } : null };
  await saveRecord(table, updated);
  return updated;
}
