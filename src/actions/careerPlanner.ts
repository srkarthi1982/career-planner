import { ActionError, defineAction } from "astro:actions";
import {
  CareerGoals,
  CareerMilestones,
  CareerTasks,
  and,
  count,
  db,
  desc,
  eq,
} from "astro:db";
import { z } from "astro:schema";
import { requirePro, requireUser } from "./_guards";
import { FREE_LIMITS } from "../lib/freeLimits";
import { buildCareerPlannerSummary } from "../dashboard/summary.schema";
import { pushCareerPlannerSummary } from "../lib/pushActivity";
import { notifyParent } from "../lib/notifyParent";

const pushSummary = async (userId: string, eventType: string) => {
  const summary = await buildCareerPlannerSummary(userId);
  await pushCareerPlannerSummary({ userId, eventType, summary });
};

const enforceActiveGoalLimit = async (context: Parameters<typeof requireUser>[0], userId: string) => {
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerGoals)
    .where(and(eq(CareerGoals.userId, userId), eq(CareerGoals.status, "active")));

  if (Number(total ?? 0) >= FREE_LIMITS.maxActiveGoals) {
    requirePro(context);
  }
};

const enforceMilestoneLimit = async (
  context: Parameters<typeof requireUser>[0],
  userId: string,
) => {
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerMilestones)
    .where(eq(CareerMilestones.userId, userId));

  if (Number(total ?? 0) >= FREE_LIMITS.maxMilestones) {
    requirePro(context);
  }
};

const enforceTaskLimit = async (context: Parameters<typeof requireUser>[0], userId: string) => {
  const [{ total } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerTasks)
    .where(eq(CareerTasks.userId, userId));

  if (Number(total ?? 0) >= FREE_LIMITS.maxTasks) {
    requirePro(context);
  }
};

const goalSchema = z.object({
  title: z.string().min(1, "Goal title is required."),
  targetRole: z.string().optional(),
  notes: z.string().optional(),
});

const goalUpdateSchema = goalSchema.extend({
  id: z.number().int(),
});

const goalIdSchema = z.object({
  id: z.number().int(),
});

const milestoneSchema = z.object({
  goalId: z.number().int(),
  title: z.string().min(1, "Milestone title is required."),
  description: z.string().optional(),
  targetDate: z.string().optional(),
});

const milestoneUpdateSchema = milestoneSchema.pick({
  title: true,
  description: true,
  targetDate: true,
}).extend({
  id: z.number().int(),
});

const milestoneStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["todo", "doing", "done"]),
});

const milestoneListSchema = z.object({
  goalId: z.number().int(),
});

const taskSchema = z.object({
  milestoneId: z.number().int(),
  title: z.string().min(1, "Task title is required."),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

const taskUpdateSchema = taskSchema.pick({
  title: true,
  notes: true,
  dueDate: true,
}).extend({
  id: z.number().int(),
});

const taskStatusSchema = z.object({
  id: z.number().int(),
  status: z.enum(["todo", "doing", "done"]),
});

const taskListSchema = z.object({
  milestoneId: z.number().int(),
});

export const createGoal = defineAction({
  input: goalSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    await enforceActiveGoalLimit(context, user.id);

    const [goal] = await db
      .insert(CareerGoals)
      .values({
        userId: user.id,
        title: input.title,
        targetRole: input.targetRole ?? null,
        notes: input.notes ?? null,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (goal) {
      await pushSummary(user.id, "career_goal_created");
    }

    return { goal };
  },
});

export const updateGoal = defineAction({
  input: goalUpdateSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const [goal] = await db
      .update(CareerGoals)
      .set({
        title: input.title,
        targetRole: input.targetRole ?? null,
        notes: input.notes ?? null,
        updatedAt: new Date(),
      })
      .where(and(eq(CareerGoals.id, input.id), eq(CareerGoals.userId, user.id)))
      .returning();

    if (!goal) {
      throw new ActionError({ code: "NOT_FOUND", message: "Goal not found." });
    }

    await pushSummary(user.id, "career_goal_updated");
    return { goal };
  },
});

export const archiveGoal = defineAction({
  input: goalIdSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const [goal] = await db
      .update(CareerGoals)
      .set({
        status: "archived",
        updatedAt: new Date(),
      })
      .where(and(eq(CareerGoals.id, input.id), eq(CareerGoals.userId, user.id)))
      .returning();

    if (!goal) {
      throw new ActionError({ code: "NOT_FOUND", message: "Goal not found." });
    }

    const url = `/goals/${goal.id}`;
    await notifyParent({
      userId: user.id,
      eventType: "career_goal_archived",
      title: `Goal archived: ${goal.title}`,
      url,
    });

    await pushSummary(user.id, "career_goal_archived");
    return {
      goal,
      notice: {
        eventType: "career_goal_archived",
        title: `Goal archived: ${goal.title}`,
        url,
      },
    };
  },
});

export const listGoals = defineAction({
  handler: async (_, context) => {
    const user = requireUser(context);
    const goals = await db
      .select()
      .from(CareerGoals)
      .where(eq(CareerGoals.userId, user.id))
      .orderBy(desc(CareerGoals.updatedAt), desc(CareerGoals.createdAt), desc(CareerGoals.id));

    return { goals };
  },
});

export const getGoal = defineAction({
  input: goalIdSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const goal = await db
      .select()
      .from(CareerGoals)
      .where(and(eq(CareerGoals.id, input.id), eq(CareerGoals.userId, user.id)))
      .get();

    if (!goal) {
      throw new ActionError({ code: "NOT_FOUND", message: "Goal not found." });
    }

    return { goal };
  },
});

export const createMilestone = defineAction({
  input: milestoneSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const goal = await db
      .select()
      .from(CareerGoals)
      .where(and(eq(CareerGoals.id, input.goalId), eq(CareerGoals.userId, user.id)))
      .get();

    if (!goal) {
      throw new ActionError({ code: "NOT_FOUND", message: "Goal not found." });
    }

    await enforceMilestoneLimit(context, user.id);

    const [milestone] = await db
      .insert(CareerMilestones)
      .values({
        userId: user.id,
        goalId: input.goalId,
        title: input.title,
        description: input.description ?? null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        status: "todo",
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (milestone) {
      await pushSummary(user.id, "career_milestone_created");
    }

    return { milestone };
  },
});

export const updateMilestone = defineAction({
  input: milestoneUpdateSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const [milestone] = await db
      .update(CareerMilestones)
      .set({
        title: input.title,
        description: input.description ?? null,
        targetDate: input.targetDate ? new Date(input.targetDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(CareerMilestones.id, input.id), eq(CareerMilestones.userId, user.id)))
      .returning();

    if (!milestone) {
      throw new ActionError({ code: "NOT_FOUND", message: "Milestone not found." });
    }

    await pushSummary(user.id, "career_milestone_updated");
    return { milestone };
  },
});

export const setMilestoneStatus = defineAction({
  input: milestoneStatusSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const completedAt = input.status === "done" ? new Date() : null;
    const [milestone] = await db
      .update(CareerMilestones)
      .set({
        status: input.status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(CareerMilestones.id, input.id), eq(CareerMilestones.userId, user.id)))
      .returning();

    if (!milestone) {
      throw new ActionError({ code: "NOT_FOUND", message: "Milestone not found." });
    }

    if (input.status === "done") {
      const url = `/goals/${milestone.goalId}`;
      await notifyParent({
        userId: user.id,
        eventType: "career_milestone_completed",
        title: `Milestone completed: ${milestone.title}`,
        url,
      });
      await pushSummary(user.id, "career_milestone_completed");
      return {
        milestone,
        notice: {
          eventType: "career_milestone_completed",
          title: `Milestone completed: ${milestone.title}`,
          url,
        },
      };
    }

    await pushSummary(user.id, "career_milestone_updated");
    return { milestone };
  },
});

export const listMilestonesByGoal = defineAction({
  input: milestoneListSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const milestones = await db
      .select()
      .from(CareerMilestones)
      .where(and(eq(CareerMilestones.goalId, input.goalId), eq(CareerMilestones.userId, user.id)))
      .orderBy(desc(CareerMilestones.updatedAt), desc(CareerMilestones.createdAt), desc(CareerMilestones.id));

    return { milestones };
  },
});

export const createTask = defineAction({
  input: taskSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const milestone = await db
      .select()
      .from(CareerMilestones)
      .where(and(eq(CareerMilestones.id, input.milestoneId), eq(CareerMilestones.userId, user.id)))
      .get();

    if (!milestone) {
      throw new ActionError({ code: "NOT_FOUND", message: "Milestone not found." });
    }

    await enforceTaskLimit(context, user.id);

    const [task] = await db
      .insert(CareerTasks)
      .values({
        userId: user.id,
        milestoneId: input.milestoneId,
        title: input.title,
        notes: input.notes ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: "todo",
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (task) {
      await pushSummary(user.id, "career_task_created");
    }

    return { task };
  },
});

export const updateTask = defineAction({
  input: taskUpdateSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const [task] = await db
      .update(CareerTasks)
      .set({
        title: input.title,
        notes: input.notes ?? null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        updatedAt: new Date(),
      })
      .where(and(eq(CareerTasks.id, input.id), eq(CareerTasks.userId, user.id)))
      .returning();

    if (!task) {
      throw new ActionError({ code: "NOT_FOUND", message: "Task not found." });
    }

    await pushSummary(user.id, "career_task_updated");
    return { task };
  },
});

export const setTaskStatus = defineAction({
  input: taskStatusSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const completedAt = input.status === "done" ? new Date() : null;
    const [task] = await db
      .update(CareerTasks)
      .set({
        status: input.status,
        completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(CareerTasks.id, input.id), eq(CareerTasks.userId, user.id)))
      .returning();

    if (!task) {
      throw new ActionError({ code: "NOT_FOUND", message: "Task not found." });
    }

    await pushSummary(
      user.id,
      input.status === "done" ? "career_task_completed" : "career_task_updated",
    );
    return { task };
  },
});

export const listTasksByMilestone = defineAction({
  input: taskListSchema,
  handler: async (input, context) => {
    const user = requireUser(context);
    const tasks = await db
      .select()
      .from(CareerTasks)
      .where(and(eq(CareerTasks.milestoneId, input.milestoneId), eq(CareerTasks.userId, user.id)))
      .orderBy(desc(CareerTasks.updatedAt), desc(CareerTasks.createdAt), desc(CareerTasks.id));

    return { tasks };
  },
});
