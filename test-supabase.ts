import { supabase } from './src/integrations/supabase/client';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const { data, error } = await supabase.from('otp_verifications').insert({ email: 'test@example.com', otp_code: '123456', expires_at: new Date().toISOString() }).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
