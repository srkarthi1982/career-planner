import { defineAction, ActionError, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import {
  CareerMilestones,
  CareerRoadmaps,
  SkillTargets,
  and,
  db,
  eq,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

async function getOwnedRoadmap(roadmapId: string, userId: string) {
  const [roadmap] = await db
    .select()
    .from(CareerRoadmaps)
    .where(and(eq(CareerRoadmaps.id, roadmapId), eq(CareerRoadmaps.userId, userId)));

  if (!roadmap) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Roadmap not found.",
    });
  }

  return roadmap;
}

async function getOwnedMilestone(milestoneId: string, roadmapId: string, userId: string) {
  await getOwnedRoadmap(roadmapId, userId);

  const [milestone] = await db
    .select()
    .from(CareerMilestones)
    .where(
      and(
        eq(CareerMilestones.id, milestoneId),
        eq(CareerMilestones.roadmapId, roadmapId)
      )
    );

  if (!milestone) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Milestone not found.",
    });
  }

  return milestone;
}

async function getOwnedSkillTarget(targetId: string, roadmapId: string, userId: string) {
  await getOwnedRoadmap(roadmapId, userId);

  const [target] = await db
    .select()
    .from(SkillTargets)
    .where(and(eq(SkillTargets.id, targetId), eq(SkillTargets.roadmapId, roadmapId)));

  if (!target) {
    throw new ActionError({
      code: "NOT_FOUND",
      message: "Skill target not found.",
    });
  }

  return target;
}

export const server = {
  createRoadmap: defineAction({
    input: z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      targetRole: z.string().optional(),
      targetDate: z.date().optional(),
      status: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const now = new Date();

      const [roadmap] = await db
        .insert(CareerRoadmaps)
        .values({
          id: crypto.randomUUID(),
          userId: user.id,
          title: input.title,
          description: input.description,
          targetRole: input.targetRole,
          targetDate: input.targetDate,
          status: input.status,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { roadmap },
      };
    },
  }),

  updateRoadmap: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        targetRole: z.string().optional(),
        targetDate: z.date().optional(),
        status: z.string().optional(),
      })
      .refine(
        (input) =>
          input.title !== undefined ||
          input.description !== undefined ||
          input.targetRole !== undefined ||
          input.targetDate !== undefined ||
          input.status !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRoadmap(input.id, user.id);

      const [roadmap] = await db
        .update(CareerRoadmaps)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.targetRole !== undefined ? { targetRole: input.targetRole } : {}),
          ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(CareerRoadmaps.id, input.id))
        .returning();

      return {
        success: true,
        data: { roadmap },
      };
    },
  }),

  listRoadmaps: defineAction({
    input: z.object({}).optional(),
    handler: async (_input, context) => {
      const user = requireUser(context);

      const roadmaps = await db
        .select()
        .from(CareerRoadmaps)
        .where(eq(CareerRoadmaps.userId, user.id));

      return {
        success: true,
        data: { items: roadmaps, total: roadmaps.length },
      };
    },
  }),

  createMilestone: defineAction({
    input: z.object({
      roadmapId: z.string().min(1),
      orderIndex: z.number().int().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      dueDate: z.date().optional(),
      status: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRoadmap(input.roadmapId, user.id);
      const now = new Date();

      const [milestone] = await db
        .insert(CareerMilestones)
        .values({
          id: crypto.randomUUID(),
          roadmapId: input.roadmapId,
          orderIndex: input.orderIndex ?? 1,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate,
          status: input.status,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { milestone },
      };
    },
  }),

  updateMilestone: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        roadmapId: z.string().min(1),
        orderIndex: z.number().int().optional(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        status: z.string().optional(),
      })
      .refine(
        (input) =>
          input.orderIndex !== undefined ||
          input.title !== undefined ||
          input.description !== undefined ||
          input.dueDate !== undefined ||
          input.status !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedMilestone(input.id, input.roadmapId, user.id);

      const [milestone] = await db
        .update(CareerMilestones)
        .set({
          ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          updatedAt: new Date(),
        })
        .where(eq(CareerMilestones.id, input.id))
        .returning();

      return {
        success: true,
        data: { milestone },
      };
    },
  }),

  deleteMilestone: defineAction({
    input: z.object({
      id: z.string().min(1),
      roadmapId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedMilestone(input.id, input.roadmapId, user.id);

      await db
        .delete(CareerMilestones)
        .where(eq(CareerMilestones.id, input.id));

      return { success: true };
    },
  }),

  listMilestones: defineAction({
    input: z.object({
      roadmapId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRoadmap(input.roadmapId, user.id);

      const milestones = await db
        .select()
        .from(CareerMilestones)
        .where(eq(CareerMilestones.roadmapId, input.roadmapId));

      return {
        success: true,
        data: { items: milestones, total: milestones.length },
      };
    },
  }),

  createSkillTarget: defineAction({
    input: z.object({
      roadmapId: z.string().min(1),
      name: z.string().min(1),
      currentLevel: z.string().optional(),
      targetLevel: z.string().optional(),
      priority: z.string().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRoadmap(input.roadmapId, user.id);
      const now = new Date();

      const [target] = await db
        .insert(SkillTargets)
        .values({
          id: crypto.randomUUID(),
          roadmapId: input.roadmapId,
          name: input.name,
          currentLevel: input.currentLevel,
          targetLevel: input.targetLevel,
          priority: input.priority,
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        success: true,
        data: { target },
      };
    },
  }),

  updateSkillTarget: defineAction({
    input: z
      .object({
        id: z.string().min(1),
        roadmapId: z.string().min(1),
        name: z.string().min(1).optional(),
        currentLevel: z.string().optional(),
        targetLevel: z.string().optional(),
        priority: z.string().optional(),
        notes: z.string().optional(),
      })
      .refine(
        (input) =>
          input.name !== undefined ||
          input.currentLevel !== undefined ||
          input.targetLevel !== undefined ||
          input.priority !== undefined ||
          input.notes !== undefined,
        { message: "At least one field must be provided to update." }
      ),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedSkillTarget(input.id, input.roadmapId, user.id);

      const [target] = await db
        .update(SkillTargets)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.currentLevel !== undefined ? { currentLevel: input.currentLevel } : {}),
          ...(input.targetLevel !== undefined ? { targetLevel: input.targetLevel } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          updatedAt: new Date(),
        })
        .where(eq(SkillTargets.id, input.id))
        .returning();

      return {
        success: true,
        data: { target },
      };
    },
  }),

  deleteSkillTarget: defineAction({
    input: z.object({
      id: z.string().min(1),
      roadmapId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedSkillTarget(input.id, input.roadmapId, user.id);

      await db
        .delete(SkillTargets)
        .where(eq(SkillTargets.id, input.id));

      return { success: true };
    },
  }),

  listSkillTargets: defineAction({
    input: z.object({
      roadmapId: z.string().min(1),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      await getOwnedRoadmap(input.roadmapId, user.id);

      const targets = await db
        .select()
        .from(SkillTargets)
        .where(eq(SkillTargets.roadmapId, input.roadmapId));

      return {
        success: true,
        data: { items: targets, total: targets.length },
      };
    },
  }),
};
