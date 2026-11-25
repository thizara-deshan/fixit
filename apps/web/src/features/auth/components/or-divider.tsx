export function OrDivider() {
  return (
    <div className="text-meta text-text-subtle flex items-center gap-3" role="separator" aria-label="or">
      <span className="bg-border h-px flex-1" aria-hidden="true" />
      <span aria-hidden="true">or</span>
      <span className="bg-border h-px flex-1" aria-hidden="true" />
    </div>
  );
}
