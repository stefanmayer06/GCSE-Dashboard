import postgres from 'postgres';

if (!process.argv.includes('--write') || process.env.SUPABASE_MIGRATION_PURGE !== 'YES') {
  throw new Error('Use --write with SUPABASE_MIGRATION_PURGE=YES after migration sign-off.');
}

const connectionString = String(process.env.SUPABASE_DB_URL || '').trim();
if (!connectionString) throw new Error('SUPABASE_DB_URL is required.');

const sql = postgres(connectionString, {
  max: 1,
  ssl: process.env.SUPABASE_DB_SSL === 'disable' ? false : 'require',
});

try {
  const [{ pending }] = await sql`
    select count(*)::integer as pending
    from migration_private.legacy_users
    where claim_status = 'pending'
  `;
  if (pending > 0) {
    throw new Error(`Refusing to purge ${pending} unclaimed legacy accounts.`);
  }

  const [{ claims }] = await sql`
    select count(*)::integer as claims from migration_private.account_claims
  `;
  const [{ progress }] = await sql`
    select count(*)::integer as progress from migration_private.legacy_subject_progress
  `;
  const [{ users }] = await sql`
    select count(*)::integer as users from migration_private.legacy_users
  `;

  await sql.begin(async (transaction) => {
    await transaction`delete from migration_private.account_claims`;
    await transaction`delete from migration_private.legacy_subject_progress`;
    await transaction`delete from migration_private.legacy_users`;
  });

  console.log(JSON.stringify({ purged: { users, progress, claims } }));
} finally {
  await sql.end({ timeout: 5 });
}
