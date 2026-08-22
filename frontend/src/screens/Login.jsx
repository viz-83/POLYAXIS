import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Loading';

const DEMO_ACCOUNTS = [
  { label: 'Alex Chapman (Technical User)', email: 'alex.chapman@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'Sarah Mitchell (Technical User)', email: 'sarah.mitchell@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'James Okafor (Technical User)', email: 'james.okafor@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'Admin User (Administrator)', email: 'admin@polyaxis-demo.com', password: 'Admin2026!' },
];

export default function Login() {
  const { login, isAuthenticated, sessionMessage, clearSessionMessage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/projects'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/projects', { replace: true });
    } catch (err) {
      // AUTH-04: generic message, never reveals which field was wrong.
      setError(apiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-950 via-brand-950 to-ink-900 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-white shadow-raised">PA</span>
          <div>
            <h1 className="text-2xl font-bold text-white">PolyAxis</h1>
            <p className="text-sm text-brand-100/80">Compliance-Constrained Trial Design Engine</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-ink-900">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-ink-500">Enter your credentials to continue.</p>

          {sessionMessage && (
            <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800" role="alert">
              {sessionMessage}
              <button type="button" onClick={clearSessionMessage} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="field-label">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              Sign In
            </button>
          </form>
        </div>

        <div className="mt-4 rounded-xl bg-white/5 p-4 text-xs text-brand-100/70 ring-1 ring-white/10">
          <p className="mb-2 font-semibold text-brand-100">Demo accounts (Phase 1 prototype)</p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account)}
                className="rounded-md bg-white/5 px-2.5 py-1.5 text-left text-brand-50 hover:bg-white/10"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-brand-100/50">PolyAxis Phase 1 Prototype · v1.0.0</p>
      </div>
    </div>
  );
}
