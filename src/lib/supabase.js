import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect whether valid Supabase credentials have been configured in .env
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseAnonKey.includes('your-supabase-anon-key')
);

let client = null;

if (isSupabaseConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
} else {
  // In-memory / localStorage fallback provider for smooth development & testing
  const STORAGE_KEY_AUTH = 'kith_kin_mock_auth';
  const STORAGE_KEY_FAMILIES = 'kith_kin_mock_families';
  const STORAGE_KEY_PEOPLE = 'kith_kin_mock_people';
  const STORAGE_KEY_RELATIONSHIPS = 'kith_kin_mock_relationships';
  const STORAGE_KEY_COLLABORATORS = 'kith_kin_mock_collaborators';

  const getStored = (key, fallback) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const setStored = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Seed initial mock user if empty
  const defaultUser = {
    id: 'usr-demo-001',
    email: 'demo@familytree.local',
    user_metadata: { full_name: 'Arthur Pendelton', avatar_url: null },
  };

  const authSubscribers = new Set();

  client = {
    isMock: true,
    auth: {
      async getSession() {
        const user = getStored(STORAGE_KEY_AUTH, defaultUser);
        return {
          data: {
            session: user ? { user, access_token: 'mock-token' } : null,
          },
          error: null,
        };
      },
      async getUser() {
        const user = getStored(STORAGE_KEY_AUTH, defaultUser);
        return { data: { user }, error: null };
      },
      async signUp({ email, password, options }) {
        const newUser = {
          id: `usr-${Date.now()}`,
          email,
          user_metadata: options?.data || { full_name: email.split('@')[0] },
        };
        setStored(STORAGE_KEY_AUTH, newUser);
        authSubscribers.forEach((cb) => cb('SIGNED_IN', { user: newUser }));
        return { data: { user: newUser, session: { user: newUser } }, error: null };
      },
      async signInWithPassword({ email, password }) {
        if (!email || !password) {
          return { data: null, error: { message: 'Email and password are required.' } };
        }
        const user = {
          id: 'usr-demo-001',
          email,
          user_metadata: { full_name: email.split('@')[0] },
        };
        setStored(STORAGE_KEY_AUTH, user);
        authSubscribers.forEach((cb) => cb('SIGNED_IN', { user }));
        return { data: { user, session: { user } }, error: null };
      },
      async signOut() {
        setStored(STORAGE_KEY_AUTH, null);
        authSubscribers.forEach((cb) => cb('SIGNED_OUT', null));
        return { error: null };
      },
      async resetPasswordForEmail(email) {
        return { data: {}, error: null };
      },
      onAuthStateChange(callback) {
        authSubscribers.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => authSubscribers.delete(callback),
            },
          },
        };
      },
    },

    from(table) {
      return {
        select(columns = '*') {
          return {
            eq(col, val) {
              return {
                async single() {
                  let items = [];
                  if (table === 'families') items = getStored(STORAGE_KEY_FAMILIES, []);
                  if (table === 'people') items = getStored(STORAGE_KEY_PEOPLE, []);
                  const found = items.find((i) => i[col] === val);
                  return { data: found || null, error: found ? null : { message: 'Not found' } };
                },
                order(orderCol, { ascending = true } = {}) {
                  return {
                    async then(resolve) {
                      let items = [];
                      if (table === 'families') items = getStored(STORAGE_KEY_FAMILIES, []);
                      if (table === 'people') items = getStored(STORAGE_KEY_PEOPLE, []);
                      if (table === 'relationships') items = getStored(STORAGE_KEY_RELATIONSHIPS, []);
                      if (table === 'family_collaborators') items = getStored(STORAGE_KEY_COLLABORATORS, []);
                      const filtered = items.filter((i) => i[col] === val);
                      resolve({ data: filtered, error: null });
                    },
                  };
                },
                async then(resolve) {
                  let items = [];
                  if (table === 'families') items = getStored(STORAGE_KEY_FAMILIES, []);
                  if (table === 'people') items = getStored(STORAGE_KEY_PEOPLE, []);
                  if (table === 'relationships') items = getStored(STORAGE_KEY_RELATIONSHIPS, []);
                  if (table === 'family_collaborators') items = getStored(STORAGE_KEY_COLLABORATORS, []);
                  const filtered = items.filter((i) => i[col] === val);
                  resolve({ data: filtered, error: null });
                },
              };
            },
            order(orderCol, { ascending = true } = {}) {
              return {
                async then(resolve) {
                  let items = [];
                  if (table === 'families') items = getStored(STORAGE_KEY_FAMILIES, []);
                  if (table === 'people') items = getStored(STORAGE_KEY_PEOPLE, []);
                  resolve({ data: items, error: null });
                },
              };
            },
            async then(resolve) {
              let items = [];
              if (table === 'families') items = getStored(STORAGE_KEY_FAMILIES, []);
              if (table === 'people') items = getStored(STORAGE_KEY_PEOPLE, []);
              if (table === 'relationships') items = getStored(STORAGE_KEY_RELATIONSHIPS, []);
              resolve({ data: items, error: null });
            },
          };
        },

        insert(records) {
          const toAdd = Array.isArray(records) ? records : [records];
          return {
            select() {
              return {
                async single() {
                  const key =
                    table === 'families'
                      ? STORAGE_KEY_FAMILIES
                      : table === 'people'
                      ? STORAGE_KEY_PEOPLE
                      : table === 'relationships'
                      ? STORAGE_KEY_RELATIONSHIPS
                      : STORAGE_KEY_COLLABORATORS;
                  const current = getStored(key, []);
                  const enriched = toAdd.map((item) => ({
                    id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ...item,
                  }));
                  setStored(key, [...current, ...enriched]);
                  return { data: enriched[0], error: null };
                },
                async then(resolve) {
                  const key =
                    table === 'families'
                      ? STORAGE_KEY_FAMILIES
                      : table === 'people'
                      ? STORAGE_KEY_PEOPLE
                      : table === 'relationships'
                      ? STORAGE_KEY_RELATIONSHIPS
                      : STORAGE_KEY_COLLABORATORS;
                  const current = getStored(key, []);
                  const enriched = toAdd.map((item) => ({
                    id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    ...item,
                  }));
                  setStored(key, [...current, ...enriched]);
                  resolve({ data: enriched, error: null });
                },
              };
            },
            async then(resolve) {
              const key =
                table === 'families'
                  ? STORAGE_KEY_FAMILIES
                  : table === 'people'
                  ? STORAGE_KEY_PEOPLE
                  : table === 'relationships'
                  ? STORAGE_KEY_RELATIONSHIPS
                  : STORAGE_KEY_COLLABORATORS;
              const current = getStored(key, []);
              const enriched = toAdd.map((item) => ({
                id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...item,
              }));
              setStored(key, [...current, ...enriched]);
              resolve({ data: enriched, error: null });
            },
          };
        },

        update(updates) {
          return {
            eq(col, val) {
              return {
                select() {
                  return {
                    async single() {
                      const key =
                        table === 'families'
                          ? STORAGE_KEY_FAMILIES
                          : table === 'people'
                          ? STORAGE_KEY_PEOPLE
                          : STORAGE_KEY_RELATIONSHIPS;
                      const current = getStored(key, []);
                      let updatedItem = null;
                      const next = current.map((i) => {
                        if (i[col] === val) {
                          updatedItem = { ...i, ...updates, updated_at: new Date().toISOString() };
                          return updatedItem;
                        }
                        return i;
                      });
                      setStored(key, next);
                      return { data: updatedItem, error: null };
                    },
                  };
                },
                async then(resolve) {
                  const key =
                    table === 'families'
                      ? STORAGE_KEY_FAMILIES
                      : table === 'people'
                      ? STORAGE_KEY_PEOPLE
                      : STORAGE_KEY_RELATIONSHIPS;
                  const current = getStored(key, []);
                  const next = current.map((i) =>
                    i[col] === val ? { ...i, ...updates, updated_at: new Date().toISOString() } : i
                  );
                  setStored(key, next);
                  resolve({ data: next, error: null });
                },
              };
            },
          };
        },

        delete() {
          return {
            eq(col, val) {
              return {
                async then(resolve) {
                  const key =
                    table === 'families'
                      ? STORAGE_KEY_FAMILIES
                      : table === 'people'
                      ? STORAGE_KEY_PEOPLE
                      : STORAGE_KEY_RELATIONSHIPS;
                  const current = getStored(key, []);
                  const next = current.filter((i) => i[col] !== val);
                  setStored(key, next);
                  resolve({ data: null, error: null });
                },
              };
            },
          };
        },
      };
    },

    storage: {
      from(bucket) {
        return {
          async upload(filePath, file) {
            // Convert file to object URL or base64
            const url = URL.createObjectURL(file);
            return {
              data: { path: filePath, url },
              error: null,
            };
          },
          getPublicUrl(filePath) {
            return {
              data: {
                publicUrl: filePath.startsWith('blob:') || filePath.startsWith('http') ? filePath : '',
              },
            };
          },
        };
      },
    },
  };
}

export const supabase = client;
