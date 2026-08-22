import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">404</p>
      <h1 className="text-2xl font-bold text-ink-900">Page not found</h1>
      <p className="text-ink-500">The page you're looking for doesn't exist.</p>
      <Link to="/projects" className="btn-primary mt-2">Back to Projects</Link>
    </div>
  );
}
