import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useParams } from 'react-router-dom';
import api, { apiErrorMessage } from './api/client';
import { ProjectProvider } from './context/ProjectContext';
import JourneyRail from './components/JourneyRail';
import Icon from './components/Icon';
import { LoadingBlock } from './components/Loading';
import { DASHBOARD_STAGE } from './utils/stages';

/**
 * Workspace shell for every /projects/:id/* screen. A single sticky bar keeps the project name and the
 * step navigation in view while the step itself scrolls beneath it.
 */
export default function ProjectLayout() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data.project);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err, 'This project could not be opened.'));
    }
  }, [id]);

  // Re-read on every step change so the navigation reflects stages completed by the previous screen.
  useEffect(() => { refresh(); }, [refresh, pathname]);

  const value = useMemo(() => ({ project, refresh }), [project, refresh]);

  if (error && !project) {
    return (
      <div className="tile mx-auto mt-10 max-w-lg text-center">
        <h1 className="text-xl font-bold">Project unavailable</h1>
        <p className="mt-2 text-ink-500">{error}</p>
        <Link to="/projects" className="btn-primary mt-5">Back to projects</Link>
      </div>
    );
  }
  if (!project) return <LoadingBlock label="Opening project…" />;

  const onOverview = pathname.endsWith('/dashboard');

  return (
    <ProjectProvider value={value}>
      <div className="z-30 -mx-4 -mt-6 border-b border-brand-100 bg-brand-50/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:sticky lg:top-14 lg:-mx-10 lg:-mt-7 lg:px-10">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="min-w-0 flex-1 basis-0">
            <Link to="/projects" className="inline-flex items-center gap-1 text-[11px] lg:hidden font-semibold text-ink-500 hover:text-brand-700">
              <Icon name="folder" className="h-3 w-3" /> Projects
            </Link>
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-base font-bold text-ink-900">{project.name}</h2>
              <span className="badge-slate hidden shrink-0 sm:inline-flex">{project.productType}</span>
            </div>
          </div>
          <div className="order-3 hidden w-full lg:block xl:order-none xl:w-auto"><JourneyRail project={project} /></div>
          <Link
            to={DASHBOARD_STAGE.path(project.id)}
            aria-current={onOverview ? 'page' : undefined}
            className={`${onOverview ? 'btn bg-ink-900 text-white' : 'btn-secondary'} !py-2`}
          >
            <Icon name="grid" className="h-4 w-4" /> <span className="hidden sm:inline">Overview</span>
          </Link>
        </div>
      </div>
      {/* §8.3: the stage stepper stays visible at all times — on phones it pins under the top bar */}
      <div className="sticky top-[52px] z-30 -mx-4 border-b border-brand-100 bg-brand-50/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <JourneyRail project={project} />
      </div>
      <div className="mt-5 space-y-5">
        <Outlet />
      </div>
    </ProjectProvider>
  );
}
