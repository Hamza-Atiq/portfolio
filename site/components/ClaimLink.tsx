/** The small `proof ↗` / `code ↗` link next to a claim (spec §6). */
export default function ClaimLink({ label, url }: { label: string; url: string }) {
  const external = /^https?:\/\//.test(url);
  return (
    <a className="claim-link" href={url} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {label} ↗
    </a>
  );
}
