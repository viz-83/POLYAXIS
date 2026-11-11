import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from './components/Logo';
import Icon from './components/Icon';
import { useAuth } from './context/AuthContext';
import { STAGES, stageIndexForPath } from './utils/stages';

function initials(name = '') {
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

/** Breadcrumb trail for the desktop header, derived from the URL alone. */
function crumbsFor(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'admin') return [{ label: 'Administration' }, { label: 'Admin panel' }];
  const trail = [{ label: 'Projects', to: '/projects' }];
  if (parts[0] !== 'projects' || !parts[1]) return trail;
  if (parts[1] === 'new') return [...trail, { label: 'New project' }];
  const stage = STAGES[stageIndexForPath(pathname)];
  return [
    ...trail,
    { label: 'Workspace', to: `/projects/${parts[1]}/dashboard` },
    { label: pathname.endsWith('/dashboard') ? 'Overview' : stage?.label || 'Step' },
  ];
}

/** Sticky white header above every desktop page: where you are on the left, who you are on the right. */
function TopBar() {
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const crumbs = crumbsFor(pathname);
  return (
    <header className="sticky top-0 z-40 hidden h-14 items-center justify-between gap-4 border-b border-brand-100 bg-white/90 px-10 shadow-header backdrop-blur lg:flex">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-ink-300">/</span>}
                {c.to && !last
                  ? <Link to={c.to} className="font-medium text-ink-500 hover:text-brand-700">{c.label}</Link>
                  : <span aria-current={last ? 'page' : undefined} className={last ? 'truncate font-display font-bold text-ink-900' : 'font-medium text-ink-500'}>{c.label}</span>}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        {!['/projects', '/projects/new'].includes(pathname) && (
          <>
            <Link to="/projects/new" className="btn-primary !px-3.5 !py-2"><Icon name="plus" className="h-4 w-4" /> New project</Link>
            <span className="h-6 w-px bg-brand-100" aria-hidden="true" />
          </>
        )}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-xs font-bold text-white">{initials(user?.name)}</span>
          <div className="hidden leading-tight xl:block">
            <p className="text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="text-xs text-ink-500">{isAdmin ? 'Administrator' : user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * `rail` is the desktop sidebar: an icon-only rail from 1024px that expands to the full sidebar from 1280px,
 * so content keeps its width on laptops. The mobile drawer is always the full version.
 */
function SideLink({ to, icon, children, end, onClick, rail, activeWhen }) {
  const { pathname } = useLocation();
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      title={typeof children === 'string' ? children : undefined}
      className={({ isActive: routerActive }) => {
        const isActive = activeWhen ? activeWhen(pathname) : routerActive;
        return `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${rail ? 'justify-center xl:justify-start' : ''} ${
          isActive ? 'bg-white/10 text-white' : 'text-brand-100/70 hover:bg-white/5 hover:text-white'
        }`;
      }}
    >
      <Icon name={icon} className="h-[18px] w-[18px] shrink-0" />
      <span className={rail ? 'hidden xl:inline' : ''}>{children}</span>
    </NavLink>
  );
}

function SidebarBody({ onNavigate, rail = false }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const full = rail ? 'hidden xl:block' : '';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={`flex h-full flex-col bg-brand-950 py-5 text-white ${rail ? 'px-3 xl:px-4' : 'px-4'}`}>
      <NavLink to="/" onClick={onNavigate} aria-label="PolyAxis home" className={`px-2 ${rail ? 'flex justify-center xl:block' : ''}`}>
        <Logo tone="light" textClass={rail ? 'hidden text-xl xl:inline' : 'text-xl'} />
      </NavLink>

      <nav className="mt-8 space-y-1" aria-label="Primary">
        <p className={`eyebrow !text-brand-300/70 px-3 pb-2 ${full}`}>Workspace</p>
        <SideLink to="/projects" icon="folder" onClick={onNavigate} rail={rail} activeWhen={(p) => p.startsWith('/projects') && p !== '/projects/new'}>Projects</SideLink>
        <SideLink to="/projects/new" icon="plus" onClick={onNavigate} rail={rail}>New project</SideLink>
        {isAdmin && (
          <>
            <p className={`eyebrow !text-brand-300/70 px-3 pb-2 pt-6 ${full}`}>Administration</p>
            {rail && <div className="mx-2 my-3 border-t border-white/10 xl:hidden" aria-hidden="true" />}
            <SideLink to="/admin" icon="shield" onClick={onNavigate} rail={rail}>Admin panel</SideLink>
          </>
        )}
      </nav>

      <div className="mt-auto space-y-3">
        <div className={`rounded-2xl bg-white/5 ring-1 ring-white/10 ${rail ? 'p-2 xl:p-3' : 'p-3'}`}>
          <div className={`flex items-center gap-3 ${rail ? 'justify-center xl:justify-start' : ''}`}>
            <span title={rail ? `${user?.name} · ${user?.role}` : undefined} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-bold">{initials(user?.name)}</span>
            <div className={`min-w-0 ${full}`}>
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-brand-100/60">{user?.role}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} title="Sign out" aria-label="Sign out" className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20">
            <Icon name="logout" className="h-4 w-4" /> <span className={rail ? 'hidden xl:inline' : ''}>Sign out</span>
          </button>
        </div>
        <NavLink to="/" onClick={onNavigate} title="Back to website" className={`flex items-center gap-2 px-2 text-xs text-brand-100/80 hover:text-white ${rail ? 'justify-center xl:justify-start' : ''}`}>
          <Icon name="home" className="h-3.5 w-3.5 shrink-0" /> <span className={rail ? 'hidden xl:inline' : ''}>Back to website</span>
        </NavLink>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); window.scrollTo({ top: 0 }); }, [pathname]);

  return (
    <div className="min-h-screen lg:pl-[4.75rem] xl:pl-64">
      {/* Desktop sidebar: icon rail at lg, full sidebar at xl */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[4.75rem] lg:block xl:w-64"><SidebarBody rail /></aside>
      <TopBar />

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-brand-950 px-4 py-3 text-white lg:hidden">
        <Logo tone="light" size="h-8 w-8" textClass="text-lg" />
        <button type="button" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white/10"><Icon name="menu" className="h-6 w-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-brand-950/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-float"><SidebarBody onNavigate={() => setOpen(false)} /></div>
        </div>
      )}

      <main className="mx-auto max-w-[88rem] px-4 py-6 sm:px-6 lg:px-10 lg:py-7"><Outlet /></main>
    </div>
  );
}
