import type { Alpine } from "alpinejs";
import { registerCareerPlannerStore } from "./modules/career-planner/store";

export default function initAlpine(Alpine: Alpine) {
  registerCareerPlannerStore(Alpine);
  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
