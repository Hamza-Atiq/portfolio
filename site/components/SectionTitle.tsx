/** Serif section title (spec §6). */
export default function SectionTitle({
  id,
  children,
  note,
}: {
  id: string;
  children: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="section-head">
      <h2 className="section-title" id={`${id}-title`}>
        {children}
      </h2>
      {note && <p className="section-note">{note}</p>}
    </div>
  );
}
