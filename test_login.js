import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'cleyton.souza@unibeer.com.br',
    password: '123456',
  });
  if (error) {
    console.error('Login Failed:', error.message);
  } else {
    console.log('Login Succeeded! User ID:', data.user.id);
  }
}

testLogin();
