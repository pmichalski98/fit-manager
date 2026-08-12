export default function Loading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <div className="bg-primary flex size-12 animate-pulse items-center justify-center rounded-[10px]">
        <svg
          width="30"
          height="30"
          viewBox="0 0 512 512"
          className="fill-primary-foreground"
        >
          <rect x="160" y="242" width="192" height="28" rx="14" />
          <rect x="122" y="168" width="46" height="176" rx="20" />
          <rect x="344" y="168" width="46" height="176" rx="20" />
          <rect x="70" y="196" width="40" height="120" rx="17" />
          <rect x="402" y="196" width="40" height="120" rx="17" />
        </svg>
      </div>
      <span className="text-muted-foreground animate-pulse font-mono text-[11px] tracking-[0.2em] uppercase">
        Loading
      </span>
    </div>
  );
}
