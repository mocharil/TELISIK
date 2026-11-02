import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import LensLoader from './lens-loader';
const Landing = lazy(() => import('./landing/landing'));
const CollectionNetwork = lazy(() => import('./collection-network'));
const DataWorkspace = lazy(() => import('./data-workspace'));
const Workspace = lazy(() => import('./workspace'));
const FeatureLab = lazy(() => import('./investigation/lab'));
import { labRoutes, type LabRoute } from './navigation';
import './reset.css';
import AppShell from './app-shell';
import './workspace.css';
import './refresh.css';
import './investigation/investigation.css';
import './investigation/lab.css';
import './investigation/impact.css';
import './focus.css';
import './sidebar.css';
import './collection.css';
import './brand.css';

const routes = [
  'home',
  'projects',
  'collected',
  'data',
  'overview',
  'posts',
  'coordination',
  'briefs',
  'simulation',
  'sources',
  ...labRoutes,
];

function route() {
  const value = window.location.hash.replace(/^#\//, '').split('/')[0];
  return routes.includes(value) ? value : 'home';
}

function pageFamily(v: string): string {
  if (['data', 'overview', 'posts', 'briefs'].includes(v)) return 'data-workbench';
  if (['review', 'hypotheses', 'ground-truth', 'blind-spots'].includes(v)) return 'evidence-review';
  if (['collected', 'coordination'].includes(v)) return 'network';
  return v;
}

function App() {
  const [view, setView] = useState(route);
  const prevViewRef = useRef(view);

  useEffect(() => {
    const change = () => {
      if (
        !window.location.hash ||
        window.location.hash.startsWith('#/') ||
        [
          '#landing-content',
          '#manfaat',
          '#cara-kerja',
          '#data-publik',
          '#faq',
          '#fitur',
          '#fitur-network',
          '#fitur-narrative',
          '#fitur-coordination',
          '#fitur-evidence',
          '#fitur-impact',
        ].includes(window.location.hash)
      ) {
        const next = route();
        const prev = prevViewRef.current;
        prevViewRef.current = next;
        setView(next);
        // Only reset scroll when navigating to a genuinely different page family, not a sub-tab
        if (pageFamily(next) !== pageFamily(prev)) {
          window.scrollTo(0, 0);
        }
      }
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);

  if (view === 'home') {
    return (
      <Suspense fallback={<LensLoader label="Opening TELISIK" />}>
        <Landing />
      </Suspense>
    );
  }

  return (
    <AppShell view={view}>
      <Suspense fallback={<LensLoader label="Opening investigation workspace" />}>
        {view === 'collected' || view === 'coordination' ? (
          <CollectionNetwork />
        ) : labRoutes.includes(view as LabRoute) ? (
          <FeatureLab view={view as LabRoute} />
        ) : ['projects', 'data', 'posts', 'overview', 'sources', 'briefs', 'simulation'].includes(
            view
          ) ? (
          <DataWorkspace view={view} />
        ) : (
          <Workspace view={view} />
        )}
      </Suspense>
    </AppShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
