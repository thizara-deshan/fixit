/** M03 placeholder body: the SPEC title as H1 only (real content arrives in M04–M13). */
export function PlaceholderScreen({
  title,
  frame = 'page',
}: {
  title: string;
  frame?: 'page' | 'card' | 'bare';
}) {
  if (frame === 'card') return <h1 className="text-title-md text-text">{title}</h1>;
  if (frame === 'bare') return <h1 className="text-title-lg text-text">{title}</h1>;
  return (
    <div className="max-w-content lg:pb-22 mx-auto w-full px-4 pb-14 pt-8 sm:px-6 lg:px-8">
      <h1 className="text-title-lg text-text">{title}</h1>
    </div>
  );
}
