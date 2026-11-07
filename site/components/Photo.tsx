import Image from "next/image";
import type { Profile } from "@/lib/content";

/**
 * Round photo only (FR-19). Both images are in the page; CSS shows the one for the current mode.
 * Next 16: `priority` no longer sets fetchpriority, so the photo asks for it directly (high, not lazy).
 */
export default function Photo({ profile }: { profile: Profile }) {
  const common = { width: 320, height: 320, sizes: "(max-width: 700px) 168px, 300px", loading: "eager" as const };
  return (
    <div className="photo">
      <Image className="photo-dark" src={profile.photo_dark.src} alt={profile.photo_dark.alt} fetchPriority="high"
        {...common} />
      <Image className="photo-light" src={profile.photo_light.src} alt={profile.photo_light.alt} fetchPriority="high"
        {...common} />
    </div>
  );
}
