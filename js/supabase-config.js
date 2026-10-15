/* ==========================================================================
   SALEEM SMM PANEL — SUPABASE CLOUD DATABASE & AUTHENTICATION CLIENT
   Provides real multi-device cloud persistence for Users, Wallets, Deposits,
   Orders, and In-Panel Live Chat.
   ========================================================================== */

const SUPABASE_STORAGE_KEYS = {
  URL: 'saleem_supabase_url',
  KEY: 'saleem_supabase_key'
};

// Default fallback configuration (can be updated via Admin Panel or localStorage)
let _spUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '';
let _spKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY) || '';

let _supabaseClient = null;

function initSupabaseInstance() {
  _spUrl = localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || _spUrl;
  _spKey = localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY) || _spKey;

  if (window.supabase && _spUrl && _spKey) {
    try {
      _supabaseClient = window.supabase.createClient(_spUrl, _spKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
      console.log('✅ Supabase Client initialized successfully!');
    } catch (e) {
      console.warn('⚠️ Supabase init failed:', e);
      _supabaseClient = null;
    }
  } else {
    _supabaseClient = null;
  }
}

// Auto-initialize on script load
initSupabaseInstance();

window.SaleemSupabase = {
  isConfigured() {
    return !!(_supabaseClient && _spUrl && _spKey);
  },

  getClient() {
    return _supabaseClient;
  },

  getConfig() {
    return {
      url: localStorage.getItem(SUPABASE_STORAGE_KEYS.URL) || '',
      key: localStorage.getItem(SUPABASE_STORAGE_KEYS.KEY) || ''
    };
  },

  saveConfig(url, key) {
    if (!url || !key) {
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.URL);
      localStorage.removeItem(SUPABASE_STORAGE_KEYS.KEY);
      _supabaseClient = null;
      return false;
    }
    localStorage.setItem(SUPABASE_STORAGE_KEYS.URL, url.trim());
    localStorage.setItem(SUPABASE_STORAGE_KEYS.KEY, key.trim());
    initSupabaseInstance();
    return this.isConfigured();
  },

  /* ---------------- Auth Methods ---------------- */
  async signUp(email, password, { name, username, phone }) {
    if (!this.isConfigured()) {
      return { success: false, fallback: true, message: 'Supabase not configured' };
    }
    try {
      const { data, error } = await _supabaseClient.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name ? name.trim() : '',
            username: username ? username.trim() : split_part(email, '@')[0],
            phone: phone ? phone.trim() : ''
          }
        }
      });

      if (error) throw error;
      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      console.error('Supabase SignUp Error:', err);
      return { success: false, message: err.message || 'Signup failed' };
    }
  },

  async signIn(email, password) {
    if (!this.isConfigured()) {
      return { success: false, fallback: true, message: 'Supabase not configured' };
    }
    try {
      const { data, error } = await _supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) throw error;

      // Fetch Profile Data
      let profile = null;
      if (data.user) {
        const { data: profData } = await _supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        profile = profData;
      }

      return { success: true, user: data.user, profile: profile, session: data.session };
    } catch (err) {
      console.error('Supabase SignIn Error:', err);
      return { success: false, message: err.message || 'Login failed' };
    }
  },

  async signOut() {
    if (this.isConfigured()) {
      try {
        await _supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('SignOut error:', e);
      }
    }
  },

  async resetPassword(email) {
    if (!this.isConfigured()) {
      return { success: false, fallback: true, message: 'Supabase not configured' };
    }
    try {
      const { data, error } = await _supabaseClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/index.html#auth'
      });
      if (error) throw error;
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err) {
      console.error('Supabase Reset Password Error:', err);
      return { success: false, message: err.message };
    }
  },

  /* ---------------- Database: Profiles / Users ---------------- */
  async fetchUsers() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('fetchUsers error:', e);
      return null;
    }
  },

  async updateUserBalance(userIdOrEmail, amountPkr) {
    if (!this.isConfigured()) return false;
    try {
      const isEmail = String(userIdOrEmail).includes('@');
      const query = _supabaseClient.from('profiles').update({
        balance_pkr: Number(amountPkr),
        balance_usd: Number((amountPkr / 280).toFixed(2))
      });

      const { error } = isEmail
        ? await query.ilike('email', userIdOrEmail.trim())
        : await query.eq('id', userIdOrEmail);

      if (error) throw error;
      return true;
    } catch (e) {
      console.error('updateUserBalance error:', e);
      return false;
    }
  },

  /* ---------------- Database: Deposits ---------------- */
  async fetchDeposits() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('deposits')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('fetchDeposits error:', e);
      return null;
    }
  },

  async createDeposit(deposit) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('deposits')
        .insert([{
          username: deposit.userId || deposit.username,
          user_email: deposit.userEmail || deposit.email,
          method: deposit.method,
          tid: deposit.tid,
          amount_pkr: deposit.amount_pkr,
          amount_usd: deposit.amount_usd || (deposit.amount_pkr / 280),
          status: 'Pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('createDeposit error:', e);
      return null;
    }
  },

  async updateDepositStatus(depositId, status) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await _supabaseClient
        .from('deposits')
        .update({ status: status })
        .eq('id', depositId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('updateDepositStatus error:', e);
      return false;
    }
  },

  /* ---------------- Database: Orders ---------------- */
  async fetchOrders() {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('orders')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('fetchOrders error:', e);
      return null;
    }
  },

  async createOrder(order) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('orders')
        .insert([{
          username: order.username,
          user_email: order.userEmail || order.email,
          service_id: order.service_id,
          service_name: order.service_name,
          link: order.link,
          quantity: order.quantity,
          charge_pkr: order.charge_pkr,
          charge_usd: order.charge_usd,
          status: 'Pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('createOrder error:', e);
      return null;
    }
  },

  async updateOrderStatus(orderId, status) {
    if (!this.isConfigured()) return false;
    try {
      const { error } = await _supabaseClient
        .from('orders')
        .update({ status: status })
        .eq('id', orderId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('updateOrderStatus error:', e);
      return false;
    }
  },

  /* ---------------- Database: Live Chats (Realtime) ---------------- */
  async fetchChats(userId) {
    if (!this.isConfigured()) return null;
    try {
      let query = _supabaseClient.from('chats').select('*').order('created_at', { ascending: true });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('fetchChats error:', e);
      return null;
    }
  },

  async sendChatMessage({ userId, userName, userEmail, sender, senderName, message }) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await _supabaseClient
        .from('chats')
        .insert([{
          user_id: userId,
          user_name: userName || userId,
          user_email: userEmail || '',
          sender: sender, // 'user' or 'admin'
          sender_name: senderName,
          message: message,
          is_read_by_admin: sender === 'admin',
          is_read_by_user: sender === 'user'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('sendChatMessage error:', e);
      return null;
    }
  },

  subscribeToChats(onNewMessage) {
    if (!this.isConfigured()) return null;
    try {
      const channel = _supabaseClient
        .channel('public:chats')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, payload => {
          if (typeof onNewMessage === 'function') {
            onNewMessage(payload.new);
          }
        })
        .subscribe();
      return channel;
    } catch (e) {
      console.error('subscribeToChats error:', e);
      return null;
    }
  }
};
