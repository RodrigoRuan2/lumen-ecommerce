// Componente Skeleton para loading states.
// Uso: <Skeleton width="100%" height={20} /> ou <SkeletonCard />

import '../styles/Skeleton.css'

export function Skeleton({ width = '100%', height = 16, radius = 6, className = '', style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width="100%" height={0} className="skeleton-card-img" />
      <div className="skeleton-card-body">
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="50%" height={20} />
        <Skeleton width="100%" height={36} radius={100} />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="products-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
