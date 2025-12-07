/**
 * Career Planner - plan goals, skills, and milestones.
 *
 * Design goals:
 * - CareerRoadmaps for a user (e.g. "Become Senior Developer").
 * - Milestones and SkillTargets under each roadmap.
 * - Simple progress tracking without over-complication.
 */

import { defineTable, column, NOW } from "astro:db";

export const CareerRoadmaps = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),                               // e.g. "Senior Backend Engineer"
    description: column.text({ optional: true }),
    targetRole: column.text({ optional: true }),
    targetDate: column.date({ optional: true }),
    status: column.text({ optional: true }),            // "planning", "in-progress", "achieved"
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const CareerMilestones = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    roadmapId: column.text({
      references: () => CareerRoadmaps.columns.id,
    }),
    orderIndex: column.number({ optional: true }),
    title: column.text(),                               // e.g. "Learn advanced SQL"
    description: column.text({ optional: true }),
    dueDate: column.date({ optional: true }),
    status: column.text({ optional: true }),            // "not-started", "in-progress", "done"
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const SkillTargets = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    roadmapId: column.text({
      references: () => CareerRoadmaps.columns.id,
    }),
    name: column.text(),                                // e.g. "Astro.js", "System Design"
    currentLevel: column.text({ optional: true }),      // "beginner", "intermediate", "advanced"
    targetLevel: column.text({ optional: true }),
    priority: column.text({ optional: true }),          // "low", "medium", "high"
    notes: column.text({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const tables = {
  CareerRoadmaps,
  CareerMilestones,
  SkillTargets,
} as const;
