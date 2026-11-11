import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';
import { Spinner } from '../components/Loading';
import Logo from '../components/Logo';

const DEMO_ACCOUNTS = [
  { label: 'Alex Chapman', role: 'Technical User', email: 'alex.chapman@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'Sarah Mitchell', role: 'Technical User', email: 'sarah.mitchell@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'James Okafor', role: 'Technical User', email: 'james.okafor@polyaxis-demo.com', password: 'Demo2026!' },
  { label: 'Admin User', role: 'Administrator', email: 'admin@polyaxis-demo.com', password: 'Admin2026!' },
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <img src="/images/polymer-pellets.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-brand-950/80 to-brand-900/60" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link to="/" aria-label="PolyAxis home"><Logo tone="light" size="h-10 w-10" textClass="text-2xl" /></Link>
          <div>
            <p className="eyebrow !text-brand-300">Compliance-constrained trial design</p>
            <h2 className="mt-4 max-w-md text-4xl font-bold leading-tight">Know which packaging trial to run next.</h2>
            <p className="mt-4 max-w-md text-brand-50/80">Rank physical trials by information gain, cost, feasibility and regulatory compliance — with the reasoning shown.</p>
          </div>
          <p className="text-xs text-brand-100/60">Photo: Pexels · Phase 1 prototype · v1.0.0</p>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center bg-paper px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden" aria-label="PolyAxis home"><Logo /></Link>

          <h1 className="text-3xl font-bold text-ink-900">Welcome back</h1>
          <p className="mt-1.5 text-ink-500">Sign in to your PolyAxis workspace.</p>

          {sessionMessage && (
            <div className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800" role="alert">
              {sessionMessage}
              <button type="button" onClick={clearSessionMessage} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <form className="card mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="field-label">Email address</label>
              <input id="email" type="email" autoComplete="email" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input id="password" type="password" autoComplete="current-password" required className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>
            )}

            <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4" />}
              Sign In
            </button>
          </form>

          <div className="mt-6">
            <p className="eyebrow !text-ink-500">Demo accounts</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="rounded-xl bg-white px-3 py-2.5 text-left shadow-card ring-1 ring-brand-900/10 transition hover:-translate-y-0.5 hover:ring-brand-300"
                  aria-label={`${account.label} (${account.role})`}
                >
                  <span className="block text-sm font-semibold text-ink-800">{account.label}</span>
                  <span className="block text-xs text-ink-500">{account.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Link to="/" className="text-sm font-medium text-brand-700 hover:underline">← Back to home</Link>
            {/* S-00: version number in the footer — visible at every screen size */}
            <p className="font-mono text-xs text-ink-500">PolyAxis Phase 1 · v1.0.0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
