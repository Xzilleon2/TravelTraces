export function AppSkeleton() {
  return (
    <div className="min-h-[70dvh] bg-[#F5F0E8] px-4 py-8 sm:px-6">
      <div className="mx-auto grid max-w-[1200px] gap-6">
        <div className="h-72 animate-skeleton rounded bg-[#EDEAE0]" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-36 animate-skeleton rounded bg-[#EDEAE0]" />
          <div className="h-36 animate-skeleton rounded bg-[#EDEAE0]" />
          <div className="h-36 animate-skeleton rounded bg-[#EDEAE0]" />
        </div>
        <div className="grid gap-3">
          <div className="h-5 w-2/3 animate-skeleton rounded bg-[#EDEAE0]" />
          <div className="h-5 w-1/2 animate-skeleton rounded bg-[#EDEAE0]" />
        </div>
      </div>
    </div>
  );
}
