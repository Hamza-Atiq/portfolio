import Home from "@/components/Home";
import { getBundle } from "@/lib/content";

export default function Page() {
  return <Home bundle={getBundle()} />;
}
