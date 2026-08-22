import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useApi } from '../hooks/useApi';
import { LoadingBlock, EmptyState } from '../components/Loading';
import ProgressStepper from '../components/ProgressStepper';

const STAGE_ROUTE = {
  Specification: (id) => `/projects/${id}/setup`,
  Requirements: (id) => `/projects/${id}/requirements`,
  Materials: (id) => `/projects/${id}/materials`,
  Optimisation: (id) => `/projects/${id}/recommendation`,
  Results: (id) => `/projects/${id}/dashboard`,
};

export default function ProjectList() {
  const { data, loading, error } = useApi(() => api.get('/projects').then((r) => r.data.projects), []);
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Packaging Transition Projects</h1>
          <p className="mt-1 text-sm text-ink-500">Create, resume, and track your mono-material packaging transitions.</p>
        </div>
        <Link to="/projects/new" className="btn-primary">+ New Project</Link>
      </div>

      {loading && <LoadingBlock label="Loading projects…" />}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!loading && !error && (!data || data.length === 0) && (
        <EmptyState
          title="No projects yet"
          description="Create your first packaging transition project to start defining requirements and generating trial recommendations."
          action={<Link to="/projects/new" className="btn-primary">Create your first project</Link>}
        />
      )}

      {!loading && data && data.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data.map((project) => (
            <div key={project.id} className="card flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-ink-900">{project.name}</h2>
                  <p className="mt-1 text-xs text-ink-500">
                    Created {new Date(project.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className="badge-slate whitespace-nowrap">{project.productType}</span>
              </div>

              <ProgressStepper currentStage={project.stage} stagesCompleted={project.stagesCompleted} />

              <div className="mt-auto flex items-center justify-between border-t border-ink-100 pt-4">
                <span className="text-xs font-medium text-ink-500">Current stage: <strong className="text-ink-700">{project.stage}</strong></span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => navigate(`/projects/${project.id}/dashboard`)}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => navigate(STAGE_ROUTE[project.stage]?.(project.id) || `/projects/${project.id}/dashboard`)}
                  >
                    Resume
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
