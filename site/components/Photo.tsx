import Image from "next/image";
import type { Profile } from "@/lib/content";

/** Round photo only (FR-19). Both images are rendered; CSS shows the one for the current mode. */
export default function Photo({ profile, size = 160 }: { profile: Profile; size?: number }) {
  return (
    <div className="photo" style={{ width: size, height: size }}>
      <Image
        className="photo-dark"
        src={profile.photo_dark.src}
        alt={profile.photo_dark.alt}
        width={size}
        height={size}
        priority
        sizes={`${size}px`}
      />
      <Image
        className="photo-light"
        src={profile.photo_light.src}
        alt={profile.photo_light.alt}
        width={size}
        height={size}
        priority
        sizes={`${size}px`}
      />
    </div>
  );
}
