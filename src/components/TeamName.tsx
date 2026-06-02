type TeamNameProps = {
  name?: string | null;
  flagUrl?: string | null;
  fallback?: string | null;
};

export function TeamName({ name, flagUrl, fallback }: TeamNameProps) {
  const label = name ?? fallback ?? "Por definir";

  return (
    <span className="inline-flex items-center gap-2">
      {flagUrl ? (
        <img
          src={flagUrl}
          alt=""
          className="h-3 w-5 rounded-sm border border-slate-200 object-cover"
        />
      ) : null}
      <span>{label}</span>
    </span>
  );
}
