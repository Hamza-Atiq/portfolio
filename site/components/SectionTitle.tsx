export default function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 className="section-title" id={`${id}-title`}>
      <span className="hash" aria-hidden="true">
        ##{" "}
      </span>
      {children}
    </h2>
  );
}
