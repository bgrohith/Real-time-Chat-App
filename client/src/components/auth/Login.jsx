import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(loginId, password);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username) => {
    try {
      setError('');
      setLoading(true);
      setLoginId(username);
      setPassword('password123');
      await login(username, 'password123');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/25 mb-4">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-indigo-400 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SAPPHIREIQ</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome Back</h1>
        <p className="text-sm text-slate-400 mt-1">Sign in to your real-time chat workspace</p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. alice or alice@example.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 text-sm outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-100 placeholder-slate-500 text-sm outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login (for easy multi-browser testing) */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-xs text-slate-400 text-center mb-3">
            Quick 1-Click Demo Login (Pass: <code className="text-indigo-300">password123</code>):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('alice')}
              className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition text-center"
            >
              👩‍💻 Alice
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('bob')}
              className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition text-center"
            >
              👨‍💻 Bob
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('charlie')}
              className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition text-center"
            >
              🧑‍💻 Charlie
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('dana')}
              className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700/60 transition text-center"
            >
              👩‍🎨 Dana
            </button>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 ml-1"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
