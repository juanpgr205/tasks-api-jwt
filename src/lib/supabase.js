import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

// La secret key se usa únicamente en el servidor.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function unwrap({ data, error }) {
  if (error) throw new HttpError(500, `Error de base de datos: ${error.message}`);
  return data;
}
