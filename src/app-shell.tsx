import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  Menu,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { LOCAL_API, requestApi } from './runtime';
import { api } from './demo';
import { sidebarGroups, sidebarItemForRoute } from './navigation';
import { AddDataModal, CreateProjectModal } from './topic-projects';
import { ProjectSelect, UiButton } from './ui-primitives';
import type { ProjectsResponse, TopicProject } from './types';

const methods = [
  [
    'Topic Projects',
    'Project-based keyword tracking with automatic post matching, account graph construction, and coordination cluster detection.',
  ],
  [
    'Interaction network',
    'Force layout, Louvain communities, and betweenness calculated from explicit post reply/quote references.',
  ],
  [
    'Narrative DNA',
    'Exact token differences and transparent wording rules comparing message evolution within the active project.',
  ],
  [
    'Coordination Fingerprint',
    'Canonical URL matching and time-window rules. Matches are candidates for review, not findings of intent.',
  ],
  [
    'Hypothesis Arena',
    'Your evidence placements and reasoning. Starter placements are scenario examples, not AI confidence scores.',
  ],
  [
    'Ground Truth Lens',
    'Source documents and captured records for verification against public claims.',
  ],
  [
    'Impact Review',
    'Separate public-narrative and complaint-outcome plans, action records, sample-rate calculations, and human review.',
  ],
];

function AnalysisInfo({ close }: { close: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const elements = dialog.current?.querySelectorAll<HTMLButtonElement>('button');
        if (elements?.length === 1) {
          event.preventDefault();
          elements[0].focus();
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="t-modal-shade" onClick={close}>
      <section
        ref={dialog}
        className="t-analysis-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="t-analysis-title"
        onClick={e => e.stopPropagation()}
      >
        <header>
          <span>ANALYSIS TRANSPARENCY</span>
          <button onClick={close} aria-label="Close analysis information">
            <X size={20} />
          </button>
        </header>
        <div>
          <span className="t-status-label">
            <span />
            Evidence-Grounded Telemetry
          </span>
          <h2 id="t-analysis-title">
            Evidence first.
            <br />
            Know how it was produced.
          </h2>
          <p>
            Each Topic Project isolates posts, accounts, and coordination signals matching its
            keyword list. All network edges, wording comparisons, and timing clusters trace
            directly back to inspectable source records.
          </p>
          <dl>
            {methods.map(([label, description]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

export default function AppShell({ view, children }: { view: string; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addDataModalOpen, setAddDataModalOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('telisik-sidebar-collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [actionsOpen, setActionsOpen] = useState(false);
  const [geminiInfo, setGeminiInfo] = useState<{
    configured: boolean;
    project?: string | null;
    model?: string | null;
  }>({ configured: false });
  const [projectsData, setProjectsData] = useState<ProjectsResponse | null>(null);

  useEffect(() => {
    if (!LOCAL_API) return;
    requestApi<{
      gemini_configured: boolean;
      gemini_project?: string | null;
      gemini_model?: string | null;
    }>('health')
      .then(h =>
        setGeminiInfo({
          configured: !!h.gemini_configured,
          project: h.gemini_project,
          model: h.gemini_model,
        }),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    const loadProj = () => {
      api<ProjectsResponse>('projects')
        .then(setProjectsData)
        .catch(() => {});
    };
    loadProj();
    window.addEventListener('telisik-project-change', loadProj);
    return () => window.removeEventListener('telisik-project-change', loadProj);
  }, []);

  const activeProject: TopicProject | null =
    projectsData?.items.find(p => p.id === projectsData.active_project_id) || null;
  const title = sidebarItemForRoute(view)?.label || 'Investigation';

  useEffect(() => {
    try {
      localStorage.setItem('telisik-sidebar-collapsed', String(collapsed));
    } catch {}
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
    setActionsOpen(false);
  }, [view]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    content.current?.setAttribute('inert', '');
    const focusFrame = requestAnimationFrame(() =>
      sidebar.current?.querySelector<HTMLButtonElement>('.t-close-sidebar')?.focus(),
    );
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
      if (event.key === 'Tab') {
        const focusable = [
          ...(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button,summary,select') ||
            []),
        ].filter(el => el.offsetParent !== null);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!sidebar.current?.contains(document.activeElement)) {
          event.preventDefault();
          first?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const resize = () => {
      if (window.innerWidth > 960) setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      content.current?.removeAttribute('inert');
      window.removeEventListener('keydown', handler);
      window.removeEventListener('resize', resize);
      opener.current?.focus();
    };
  }, [mobileOpen]);

  const handleProjectSelect = (val: string) => {
    api('projects/active', 'PUT', { project_id: val === 'all' ? null : val }).catch(() => {});
  };

  return (
    <div className={`telisik-app ${collapsed ? 'ns-is-collapsed' : ''}`}>
      <a className="t-skip" href="#telisik-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button
          className="t-sidebar-shade"
          aria-label="Close navigation overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        id="telisik-sidebar"
        className={`t-sidebar ${mobileOpen ? 'is-open' : ''}`}
        aria-label="TELISIK sidebar"
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? true : undefined}
      >
        <div className="t-brand-row">
          <a
            href="#/home"
            className="t-brand"
            aria-label="TELISIK home"
            onClick={() => setMobileOpen(false)}
          >
            <img src="/brand/telisik-lens.png" width="42" height="42" alt="" />
            <span>
              TELISIK<small>FOLLOW THE EVIDENCE</small>
            </span>
          </a>
          <button
            className="ns-fold"
            onClick={() => setCollapsed(value => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-controls="telisik-sidebar"
            aria-expanded={!collapsed}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>
          <button
            className="t-close-sidebar"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Hoverable Project Container: works both expanded and when sidebar is folded */}
        <div className="t-case-rail">
          <button
            type="button"
            className="ns-mini-case"
            aria-label={`Project Aktif: ${
              activeProject ? `${activeProject.code} · ${activeProject.name}` : 'Semua Topik (Global)'
            }. Arahkan kursor untuk mengganti project.`}
          >
            <span>{activeProject ? activeProject.code.replace('PRJ-', 'P') : 'ALL'}</span>
            <ChevronDown size={11} className="ns-mini-case-caret" />
          </button>

          <div className="t-case">
            <span className="t-case-label">
              PROJECT AKTIF <b>{activeProject ? activeProject.code : 'GLOBAL'}</b>
            </span>
            <strong>{activeProject ? activeProject.name : 'Semua Topik (Global)'}</strong>
            <span className="t-case-mode">
              <i />
              {activeProject
                ? `${activeProject.metrics.total_posts} post · ${activeProject.metrics.coordination_clusters} sinyal · ${activeProject.metrics.alert_level}`
                : `${projectsData?.total_global_posts || 120} post gabungan`}
            </span>
            {projectsData && projectsData.items.length > 0 && (
              <div className="t-case-project-bar">
                <ProjectSelect
                  projects={projectsData.items}
                  activeProjectId={activeProject?.id || 'all'}
                  onSelect={handleProjectSelect}
                  variant="dark"
                />
                <div className="t-case-btn-row">
                  {activeProject && (
                    <UiButton
                      variant="sidebar-action"
                      size="xs"
                      onClick={() => {
                        setMobileOpen(false);
                        setAddDataModalOpen(true);
                      }}
                    >
                      <Database size={11} /> DATA
                    </UiButton>
                  )}
                  <UiButton
                    variant="sidebar-add"
                    size="xs"
                    onClick={() => {
                      setMobileOpen(false);
                      setCreateModalOpen(true);
                    }}
                  >
                    <Plus size={11} /> PROJECT
                  </UiButton>
                </div>
              </div>
            )}
            <span className="t-case-corner" aria-hidden="true" />
          </div>
        </div>

        <div className="t-sidebar-scroll">
          {sidebarGroups.map(group => (
            <section key={group.label} className="ns-group" aria-label={group.label}>
              <h2 className="ns-group-label">
                {group.label}
                <span>{String(group.items.length).padStart(2, '0')}</span>
              </h2>
              <nav aria-label={`${group.label} navigation`}>
                {group.items.map(({ id, label, icon: Icon, routes }) => {
                  const active = routes.includes(view);
                  return (
                    <a
                      key={id}
                      href={`#/${id === 'coordination' ? 'collected' : id}`}
                      className={`ns-nav-link ${active ? 'is-active' : ''}`}
                      aria-label={label}
                      title={label}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon size={18} strokeWidth={1.8} />
                      <span>{label}</span>
                      {active && <ChevronRight className="ns-active-arrow" size={13} />}
                    </a>
                  );
                })}
              </nav>
            </section>
          ))}
          <details
            className="t-route-actions"
            open={actionsOpen}
            onToggle={event => setActionsOpen(event.currentTarget.open)}
          >
            <summary
              aria-label="Page actions"
              title="Page actions"
              onClick={event => {
                if (collapsed && window.innerWidth > 960) {
                  event.preventDefault();
                  setCollapsed(false);
                  setActionsOpen(true);
                }
              }}
            >
              <MoreHorizontal size={18} />
              <span>Page actions</span>
              <ChevronDown size={14} />
            </summary>
            <div id="telisik-page-actions" onClick={() => setMobileOpen(false)} />
          </details>
        </div>

        <div className="t-sidebar-footer">
          <button
            className="t-analysis-mode"
            aria-label={
              geminiInfo.configured
                ? 'Analysis transparency: AI synthesis engine connected'
                : 'Analysis transparency: algorithmic telemetry active'
            }
            title={
              geminiInfo.configured
                ? 'AI synthesis engine connected'
                : 'Analysis transparency · Rule-based & AI ready'
            }
            onClick={() => {
              setMobileOpen(false);
              setInfo(true);
            }}
          >
            <span className="t-status-icon">
              <ShieldCheck size={17} />
            </span>
            <span>
              <strong>{geminiInfo.configured ? 'AI Engine Active' : 'Evidence Telemetry'}</strong>
              <small>
                {geminiInfo.configured ? 'Evidence-grounded synthesis' : 'Rule-based verification'}
              </small>
            </span>
            <CircleHelp size={15} />
          </button>
          <p className="t-local-mode">
            {geminiInfo.configured ? 'Mesin Sintesis AI · Live ready' : 'Project-based topic tracking'}
          </p>
        </div>
      </aside>

      <div className="t-mobile-bar">
        <button
          ref={opener}
          aria-label="Open sidebar"
          aria-controls="telisik-sidebar"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={22} />
        </button>
        <span>{title}</span>
        <span className="t-mobile-case">{activeProject ? activeProject.code : 'GLOBAL'}</span>
      </div>

      <div ref={content} id="telisik-content" className="t-page-content" tabIndex={-1}>
        {children}
      </div>

      {info && <AnalysisInfo close={() => setInfo(false)} />}
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={res => setProjectsData(res)}
      />
      <AddDataModal
        open={addDataModalOpen}
        project={activeProject}
        onClose={() => setAddDataModalOpen(false)}
        onUpdated={res => setProjectsData(res)}
      />
    </div>
  );
}
