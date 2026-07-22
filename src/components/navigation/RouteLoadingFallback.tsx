type RouteLoadingFallbackProps = {
  withHeaderOffset?: boolean;
};

export const RouteLoadingFallback = ({ withHeaderOffset = false }: RouteLoadingFallbackProps) => (
  <div
    aria-label="Đang tải nội dung"
    aria-live="polite"
    className={`picklink-route-loading w-full bg-background px-4 sm:px-6 lg:px-8 ${
      withHeaderOffset ? 'min-h-[calc(100dvh-4rem)] pt-24' : 'min-h-dvh pt-10'
    }`}
    role="status"
  >
    <div className="mx-auto w-full max-w-[1180px]">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-surface-container-high motion-reduce:animate-none" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded-md bg-surface-container motion-reduce:animate-none" />
      <div className="mt-7 grid gap-4 md:grid-cols-[1.35fr_0.65fr]">
        <div className="h-56 animate-pulse rounded-2xl border border-outline-variant bg-surface motion-reduce:animate-none" />
        <div className="h-56 animate-pulse rounded-2xl border border-outline-variant bg-surface-container-low motion-reduce:animate-none" />
      </div>
    </div>
    <span className="sr-only">Đang tải trang mới</span>
  </div>
);
