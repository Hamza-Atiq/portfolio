import SectionTitle from "@/components/SectionTitle";

/** One band of the main page: full-width background, content in the wide container. */
export default function Section({
  id,
  title,
  note,
  compact = false,
  children,
}: {
  id: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={compact ? "band compact" : "band"} aria-labelledby={`${id}-title`}>
      <div className="container">
        <SectionTitle id={id} note={note}>
          {title}
        </SectionTitle>
        {children}
      </div>
    </section>
  );
}
