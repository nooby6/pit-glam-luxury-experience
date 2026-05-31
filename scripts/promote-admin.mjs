#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const email = process.argv[2] || 'admin@pitglam.co.ke';

const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !supabaseKey) {
  console.error('Error: SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY must be set in the environment.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, supabaseKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log('Promoting', email, 'to admin (calling promote_first_admin)...');
  const { data, error } = await supabase.rpc('promote_first_admin', { _email: email });
  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }
  console.log('RPC result:', data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
