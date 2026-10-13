import { unwrap } from '../../lib/supabase.js';
import { HttpError } from '../../utils/http-error.js';

const TABLE = 'users';

export function createUsersRepository(db) {
  return {
    async findByEmail(email) {
      return unwrap(await db.from(TABLE).select('id, email, password_hash').eq('email', email).maybeSingle());
    },
    async create({ email, passwordHash }) {
      const result = await db.from(TABLE).insert({ email, password_hash: passwordHash })
        .select('id, email, created_at').single();
      // Dos registros simultáneos pueden intentar usar el mismo email.
      if (result.error?.code === '23505') throw HttpError.conflict('El email ya está registrado');
      return unwrap(result);
    },
  };
}
