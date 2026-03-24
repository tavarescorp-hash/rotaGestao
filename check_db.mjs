import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qjorjwecvevznondkwrc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqb3Jqd2VjdmV2em5vbmRrd3JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NTA2MDgsImV4cCI6MjA4NzEyNjYwOH0.dR8mFNBB5DqROviQ39LES01UxJSs15uDB3cO-X16CZ8";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: visits } = await supabase.from('visitas').select('*').limit(1);
  console.log("Visit keys:", Object.keys(visits[0]));
}
run();
