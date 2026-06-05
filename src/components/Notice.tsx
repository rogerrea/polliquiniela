type NoticeProps = {
  error?: string;
  notice?: string;
};

export function Notice({ error, notice }: NoticeProps) {
  if (!error && !notice) return null;

  return (
    <div
      className={`rounded-md border px-4 py-3 text-sm ${
        error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-violet-200 bg-violet-50 text-violet-900"
      }`}
    >
      {error ?? notice}
    </div>
  );
}
