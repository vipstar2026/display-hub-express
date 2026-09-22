export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-b from-card to-card/40">
      <div className="relative aspect-square w-full overflow-hidden">
        <div className="absolute inset-3 animate-pulse rounded-lg bg-primary/5 ring-1 ring-primary/10" />
      </div>
      <div className="px-3 pt-2.5">
        <div className="min-h-[2.25rem] space-y-1.5">
          <div className="h-3 w-full animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-primary/10" />
        </div>
        <div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-primary/10" />
      </div>
      <div className="mt-auto p-2.5 pt-2">
        <div className="h-8 w-full animate-pulse rounded-md bg-primary/10" />
      </div>
    </div>
  );
}

export function CategoryTileSkeleton() {
  return (
    <div className="rounded-xl border border-primary/10 bg-card p-4 text-center">
      <div className="mx-auto mb-2 h-12 w-12 animate-pulse rounded-lg bg-primary/10" />
      <div className="mx-auto h-4 w-3/4 animate-pulse rounded bg-primary/10" />
    </div>
  );
}
