import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, X } from 'lucide-react';
import type { TopicProject } from './types';

export type UiButtonVariant =
  | 'primary'
  | 'secondary'
  | 'selected'
  | 'ghost'
  | 'danger'
  | 'sidebar-action'
  | 'sidebar-add';

export type UiButtonSize = 'xs' | 'sm' | 'md';

interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  href?: string;
  children: ReactNode;
}

export function UiButton({
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  children,
  ...rest
}: UiButtonProps) {
  const classes = `ui-btn ui-btn--${variant} ui-btn--${size} ${className}`.trim();
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={rest.type || 'button'} className={classes} {...rest}>
      {children}
    </button>
  );
}

interface UiSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'light' | 'dark';
  label?: string;
  children: ReactNode;
}

export function UiSelect({
  variant = 'light',
  label,
  className = '',
  children,
  ...rest
}: UiSelectProps) {
  const selectEl = (
    <div className={`ui-select-wrap ui-select-wrap--${variant} ${className}`.trim()}>
      <select className={`ui-select ui-select--${variant}`} {...rest}>
        {children}
      </select>
    </div>
  );
  if (!label) return selectEl;
  return (
    <label className="tp-field">
      <span>{label}</span>
      {selectEl}
    </label>
  );
}

interface ProjectSelectProps {
  projects: TopicProject[];
  activeProjectId: string | null | undefined;
  onSelect: (projectId: string) => void;
  variant?: 'light' | 'dark';
  showPostCount?: boolean;
}

export function ProjectSelect({
  projects,
  activeProjectId,
  onSelect,
  variant = 'dark',
  showPostCount = false,
}: ProjectSelectProps) {
  return (
    <UiSelect
      variant={variant}
      aria-label="Pilih Project Topik Aktif"
      value={activeProjectId || 'all'}
      onChange={e => onSelect(e.target.value)}
    >
      {projects.map(p => (
        <option key={p.id} value={p.id}>
          {p.code} · {p.name}
          {showPostCount ? ` (${p.metrics.total_posts} post)` : ''}
        </option>
      ))}
      <option value="all">GLOBAL · Semua Topik Gabungan</option>
    </UiSelect>
  );
}

export function UiBadge({
  variant = 'code',
  children,
}: {
  variant?: 'code' | 'topic' | 'active';
  children: ReactNode;
}) {
  if (variant === 'active') {
    return (
      <span className="tp-active-indicator">
        <i className="tp-live-dot" /> {children}
      </span>
    );
  }
  if (variant === 'topic') {
    return <span className="tp-topic-badge">{children}</span>;
  }
  return <span className="tp-code-badge">{children}</span>;
}

export function UiAlertPill({
  level,
  label,
}: {
  level: TopicProject['metrics']['alert_level'];
  label?: string;
}) {
  return (
    <span className={`tp-alert-pill is-${level.toLowerCase().replace(/\s+/g, '-')}`}>
      {level === 'HIGH SIGNAL' ? (
        <AlertTriangle size={12} />
      ) : level === 'ELEVATED' ? (
        <Sparkles size={12} />
      ) : (
        <CheckCircle2 size={12} />
      )}
      {label || level}
    </span>
  );
}

interface UiModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  description?: string;
  size?: 'md' | 'lg';
  footer?: ReactNode;
  children: ReactNode;
}

export function UiModal({
  open,
  onClose,
  eyebrow,
  title,
  description,
  size = 'md',
  footer,
  children,
}: UiModalProps) {
  if (!open) return null;
  return (
    <div className="tp-modal-backdrop" onClick={onClose}>
      <section
        className={`tp-create-card tp-create-modal ${size === 'lg' ? 'tp-detail-modal' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <header className="tp-create-header">
          <div>
            <span className="tp-eyebrow">{eyebrow}</span>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
          <UiButton variant="ghost" size="xs" onClick={onClose} aria-label="Tutup popup">
            <X size={16} />
          </UiButton>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="tp-create-footer">{footer}</div>}
      </section>
    </div>
  );
}
