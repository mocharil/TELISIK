export type FeatureIconName = 'network' | 'narrative' | 'coordination' | 'evidence' | 'impact';

export function CustomIcon({ name, size = 64, className = '' }: {
  name: FeatureIconName; size?: number; className?: string;
}) {
  return <img className={`tf-custom-icon ${className}`} src={`/feature-icons/${name}.webp`}
    width={size} height={size} alt="" loading="lazy" decoding="async" />;
}
