import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { LoadingBlock, EmptyState } from '../components/Loading';
import StageDots from '../components/StageDots';
import Icon from '../components/Icon';
import { ScoreRing } from '../components/charts';
import { stageByName, STAGES } from '../utils/stages';

function ProjectCard({ project }) {
  const stage = stageByName(project.stage);
  const done = project.stagesCompleted.length;
  const pct = Math.round((done / STAGES.length) * 100);
  return (
    <article className="tile group relative flex flex-col gap-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-raised">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stage.theme.grad} opacity-10 transition-opacity group-hover:opacity-20`} />
      <div className="relative flex items-start gap-4">
        <ScoreRing value={pct} size={64} stroke={7} color={stage.theme.hex} track="#eaedf0" textClass="text-ink-900" sub="%" />
        <div className="min-w-0 flex-1">
          <span className="badge-slate">{project.productType}</span>
          <h3 className="mt-2 text-base font-bold leading-snug text-ink-900">{project.name}</h3>
          <p className="mt-1 text-xs text-ink-500">Created {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>
      <StageDots stage={project.stage} stagesCompleted={project.stagesCompleted} />
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
        <p className="text-xs text-ink-500">Next up <strong className={`block text-sm ${stage.theme.text}`}>{stage.label}</strong></p>
        <div className="flex gap-2">
          <Link to={`/projects/${project.id}/dashboard`} className="btn-secondary !px-3">Overview</Link>
          <Link to={stage.path(project.id)} className="btn-primary !px-3">Resume <Icon name="arrow" className="h-4 w-4" /></Link>
        </div>
      </div>
    </article>
  );
}

export default function ProjectList() {
  const { user } = useAuth();
  const { data, loading, error } = useApi(() => api.get('/projects').then((r) => r.data.projects), []);

  const total = data?.length || 0;
  const optimising = data?.filter((p) => ['Optimisation', 'Results'].includes(p.stage)).length || 0;
  const needSetup = data?.filter((p) => ['Specification', 'Requirements'].includes(p.stage)).length || 0;

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-brand-950 to-brand-900 p-7 text-white sm:p-9">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow !text-brand-300">Welcome back, {user?.name?.split(' ')[0]}</p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your packaging transitions</h1>
            <p className="mt-2 max-w-xl text-brand-50/70">Pick up where you left off, or start a new move from laminate to mono-material.</p>
          </div>
          <Link to="/projects/new" className="btn bg-brand-400 px-5 py-3 text-ink-950 hover:bg-brand-300"><Icon name="plus" /> New project</Link>
        </div>
        <dl className="relative mt-8 grid max-w-xl grid-cols-3 gap-4">
          {[['Projects', total], ['In optimisation', optimising], ['Being set up', needSetup]].map(([l, v]) => (
            <div key={l} className="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
              <dd className="font-mono text-2xl font-semibold">{v}</dd>
              <dt className="text-xs text-brand-100/70">{l}</dt>
            </div>
          ))}
        </dl>
      </header>

      {loading && <LoadingBlock label="Loading projects…" />}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && total === 0 && (
        <EmptyState
          title="No projects yet"
          description="Create your first packaging transition project to define requirements and generate a ranked trial recommendation."
          action={<Link to="/projects/new" className="btn-primary">Create your first project</Link>}
        />
      )}

      {!loading && total > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.map((p) => <ProjectCard key={p.id} project={p} />)}
          <Link to="/projects/new" className="flex min-h-[14rem] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-ink-200 text-ink-400 transition-colors hover:border-brand-400 hover:text-brand-700">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-card"><Icon name="plus" className="h-6 w-6" /></span>
            <span className="text-sm font-semibold">Start a new transition</span>
          </Link>
        </div>
      )}
    </div>
  );
}
