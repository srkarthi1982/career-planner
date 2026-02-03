import type { Alpine } from "alpinejs";

export default function initAlpine(Alpine: Alpine) {
  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
