const SkeletonCard = () => (
  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
    <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
    <div className="space-y-2 p-4">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  </div>
);

export default SkeletonCard;
