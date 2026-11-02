import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { PageActionScope } from '../page-actions';

type PanelProps = { id: string; label: string; children: ReactNode };
export function FocusPanel({ children }: PanelProps) {
  return <>{children}</>;
}

/** Keep inactive panels mounted and keep viewport scroll steady so changing tabs never jumps the screen. */
export function FocusPanels({
  label,
  children,
  initial,
  active,
  onChange,
}: {
  label: string;
  children: ReactNode;
  initial?: string;
  active?: string;
  onChange?: (id: string) => void;
}) {
  const panels = Children.toArray(children).filter(
    (child): child is ReactElement<PanelProps> =>
      isValidElement<PanelProps>(child) && child.type === FocusPanel
  );
  const [selected, setSelected] = useState(initial || panels[0]?.props.id);
  const requested = active ?? selected;
  const current = panels.some(p => p.props.id === requested)
    ? requested
    : panels[0]?.props.id;
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (initial && panels.some(p => p.props.id === initial)) {
      setSelected(initial);
    }
  }, [initial]);

  useEffect(() => {
    const focused = document.activeElement;
    if (
      focused &&
      root.current?.contains(focused) &&
      focused.closest('[role="tabpanel"]')?.hasAttribute('hidden')
    ) {
      buttons.current[current]?.focus({ preventScroll: true });
    }
  }, [current]);

  function select(id: string, focus = false) {
    const savedScrollY = window.scrollY;
    setSelected(id);
    onChange?.(id);
    requestAnimationFrame(() => {
      if (focus) {
        buttons.current[id]?.focus({ preventScroll: true });
      }
      // Keep scroll position steady so switching tabs never jumps the page
      if (Math.abs(window.scrollY - savedScrollY) > 2) {
        window.scrollTo({ top: savedScrollY, behavior: 'instant' as ScrollBehavior });
      }
    });
  }

  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = panels.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % panels.length
        : event.key === 'ArrowLeft'
        ? (index + last) % panels.length
        : event.key === 'Home'
        ? 0
        : event.key === 'End'
        ? last
        : null;
    if (next !== null) {
      event.preventDefault();
      select(panels[next].props.id, true);
    }
  }

  return (
    <div ref={root} className="fp-root">
      <div className="fp-tabs" role="tablist" aria-label={label}>
        {panels.map((panel, i) => (
          <button
            key={panel.props.id}
            type="button"
            ref={el => {
              buttons.current[panel.props.id] = el;
            }}
            id={`${prefix}-tab-${panel.props.id}`}
            role="tab"
            aria-selected={current === panel.props.id}
            aria-controls={`${prefix}-panel-${panel.props.id}`}
            tabIndex={current === panel.props.id ? 0 : -1}
            onClick={() => select(panel.props.id)}
            onKeyDown={e => keyboard(e, i)}
          >
            {panel.props.label}
          </button>
        ))}
      </div>
      {panels.map(panel => (
        <section
          key={panel.props.id}
          id={`${prefix}-panel-${panel.props.id}`}
          className="fp-panel"
          role="tabpanel"
          aria-labelledby={`${prefix}-tab-${panel.props.id}`}
          hidden={current !== panel.props.id}
        >
          <PageActionScope active={current === panel.props.id}>
            {panel.props.children}
          </PageActionScope>
        </section>
      ))}
    </div>
  );
}
