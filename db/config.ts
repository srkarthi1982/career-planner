import { defineDb } from "astro:db";
import { CareerGoals, CareerMilestones, CareerTasks } from "./tables";

export default defineDb({
  tables: {
    CareerGoals,
    CareerMilestones,
    CareerTasks,
  },
});
