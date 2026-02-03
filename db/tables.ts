import { column, defineTable, NOW } from "astro:db";

export const CareerGoals = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    title: column.text(),
    targetRole: column.text({ optional: true }),
    notes: column.text({ optional: true }),
    status: column.text({ enum: ["active", "archived"], default: "active" }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const CareerMilestones = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    goalId: column.number({ references: () => CareerGoals.columns.id }),
    title: column.text(),
    description: column.text({ optional: true }),
    targetDate: column.date({ optional: true }),
    status: column.text({ enum: ["todo", "doing", "done"], default: "todo" }),
    completedAt: column.date({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const CareerTasks = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    userId: column.text(),
    milestoneId: column.number({ references: () => CareerMilestones.columns.id }),
    title: column.text(),
    notes: column.text({ optional: true }),
    dueDate: column.date({ optional: true }),
    status: column.text({ enum: ["todo", "doing", "done"], default: "todo" }),
    completedAt: column.date({ optional: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const careerPlannerTables = {
  CareerGoals,
  CareerMilestones,
  CareerTasks,
} as const;
