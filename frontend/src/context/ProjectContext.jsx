import { createContext, useContext } from 'react';

const ProjectContext = createContext(null);

export const ProjectProvider = ProjectContext.Provider;

/** The project currently open in the workspace shell: { project, refresh }. */
export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside a ProjectLayout route');
  return ctx;
}
