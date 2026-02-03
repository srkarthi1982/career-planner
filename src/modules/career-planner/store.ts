import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";
import type {
  CareerGoalDTO,
  CareerMilestoneDTO,
  CareerNotice,
  CareerTaskDTO,
  GoalForm,
  MilestoneForm,
  TaskForm,
} from "./types";

const defaultGoalForm = (): GoalForm => ({
  title: "",
  targetRole: "",
  notes: "",
});

const defaultMilestoneForm = (): MilestoneForm => ({
  title: "",
  description: "",
  targetDate: "",
});

const defaultTaskForm = (): TaskForm => ({
  title: "",
  notes: "",
  dueDate: "",
});

const defaultState = () => ({
  goals: [] as CareerGoalDTO[],
  activeGoalId: null as number | null,
  milestonesByGoal: {} as Record<number, CareerMilestoneDTO[]>,
  tasksByMilestone: {} as Record<number, CareerTaskDTO[]>,
  loading: false,
  error: null as string | null,
  success: null as string | null,
  notice: null as CareerNotice | null,
  isPaid: false,
  goalForm: defaultGoalForm(),
  milestoneForm: defaultMilestoneForm(),
  taskForm: defaultTaskForm(),
});

export class CareerPlannerStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  goals: CareerGoalDTO[] = [];
  activeGoalId: number | null = null;
  milestonesByGoal: Record<number, CareerMilestoneDTO[]> = {};
  tasksByMilestone: Record<number, CareerTaskDTO[]> = {};
  loading = false;
  error: string | null = null;
  success: string | null = null;
  notice: CareerNotice | null = null;
  isPaid = false;
  goalForm: GoalForm = defaultGoalForm();
  milestoneForm: MilestoneForm = defaultMilestoneForm();
  taskForm: TaskForm = defaultTaskForm();

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    Object.assign(this, defaultState(), initial);
    this.goals = (initial.goals ?? []) as CareerGoalDTO[];
  }

  private unwrap<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  private setNotice(payload?: CareerNotice | null) {
    if (payload) {
      this.notice = payload;
    }
  }

  setBillingStatus(isPaid: boolean) {
    this.isPaid = Boolean(isPaid);
  }

  get activeGoal() {
    return this.goals.find((goal) => goal.id === this.activeGoalId) ?? null;
  }

  async loadGoals() {
    this.loading = true;
    this.error = null;
    try {
      const res = await actions.careerPlanner.listGoals();
      const data = this.unwrap<{ goals: CareerGoalDTO[] }>(res);
      this.goals = data.goals ?? [];
      const active = this.goals.find((goal) => goal.status === "active");
      this.activeGoalId = active?.id ?? null;
    } catch (err: any) {
      this.error = err?.message || "Failed to load goals.";
    } finally {
      this.loading = false;
    }
  }

  async createGoal() {
    if (!this.goalForm.title.trim()) {
      this.error = "Goal title is required.";
      return;
    }
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const res = await actions.careerPlanner.createGoal({
        title: this.goalForm.title.trim(),
        targetRole: this.goalForm.targetRole.trim() || undefined,
        notes: this.goalForm.notes.trim() || undefined,
      });
      const data = this.unwrap<{ goal: CareerGoalDTO }>(res);
      if (data.goal) {
        this.goals = [data.goal, ...this.goals];
        this.activeGoalId = data.goal.status === "active" ? data.goal.id : this.activeGoalId;
        this.goalForm = defaultGoalForm();
        this.success = "Goal created.";
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to create goal.";
    } finally {
      this.loading = false;
    }
  }

  async updateGoal(goalId: number, updates: Partial<GoalForm>) {
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const res = await actions.careerPlanner.updateGoal({
        id: goalId,
        title: updates.title?.trim() ?? "",
        targetRole: updates.targetRole?.trim() || undefined,
        notes: updates.notes?.trim() || undefined,
      });
      const data = this.unwrap<{ goal: CareerGoalDTO }>(res);
      if (data.goal) {
        this.goals = this.goals.map((goal) => (goal.id === data.goal.id ? data.goal : goal));
        this.success = "Goal updated.";
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to update goal.";
    } finally {
      this.loading = false;
    }
  }

  async archiveGoal(goalId: number) {
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const res = await actions.careerPlanner.archiveGoal({ id: goalId });
      const data = this.unwrap<{ goal: CareerGoalDTO; notice?: CareerNotice }>(res);
      if (data.goal) {
        this.goals = this.goals.map((goal) => (goal.id === data.goal.id ? data.goal : goal));
        if (this.activeGoalId === data.goal.id) {
          const active = this.goals.find((goal) => goal.status === "active");
          this.activeGoalId = active?.id ?? null;
        }
        this.success = "Goal archived.";
        this.setNotice(data.notice ?? null);
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to archive goal.";
    } finally {
      this.loading = false;
    }
  }

  async loadGoalDetail(goalId: number) {
    this.loading = true;
    this.error = null;
    try {
      const [goalRes, milestoneRes] = await Promise.all([
        actions.careerPlanner.getGoal({ id: goalId }),
        actions.careerPlanner.listMilestonesByGoal({ goalId }),
      ]);
      const goalData = this.unwrap<{ goal: CareerGoalDTO }>(goalRes);
      const milestoneData = this.unwrap<{ milestones: CareerMilestoneDTO[] }>(milestoneRes);
      if (goalData.goal) {
        const exists = this.goals.find((goal) => goal.id === goalData.goal.id);
        if (!exists) {
          this.goals = [goalData.goal, ...this.goals];
        }
      }
      this.activeGoalId = goalId;
      const milestones = milestoneData.milestones ?? [];
      this.milestonesByGoal[goalId] = milestones;

      await Promise.all(
        milestones.map(async (milestone) => {
          const res = await actions.careerPlanner.listTasksByMilestone({ milestoneId: milestone.id });
          const data = this.unwrap<{ tasks: CareerTaskDTO[] }>(res);
          this.tasksByMilestone[milestone.id] = data.tasks ?? [];
        }),
      );
    } catch (err: any) {
      this.error = err?.message || "Failed to load goal details.";
    } finally {
      this.loading = false;
    }
  }

  getMilestones(goalId: number) {
    return this.milestonesByGoal[goalId] ?? [];
  }

  getTasks(milestoneId: number) {
    return this.tasksByMilestone[milestoneId] ?? [];
  }

  getMilestoneProgress(goalId: number) {
    const milestones = this.getMilestones(goalId);
    const total = milestones.length;
    const done = milestones.filter((milestone) => milestone.status === "done").length;
    return { total, done };
  }

  getNextDueTasks(goalId: number, limit = 3) {
    const milestones = this.getMilestones(goalId);
    const tasks = milestones.flatMap((milestone) => this.getTasks(milestone.id));
    const upcoming = tasks
      .filter((task) => task.status !== "done")
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return aDate - bDate;
      });
    return upcoming.slice(0, limit);
  }

  async createMilestone(goalId: number) {
    if (!this.milestoneForm.title.trim()) {
      this.error = "Milestone title is required.";
      return;
    }
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const res = await actions.careerPlanner.createMilestone({
        goalId,
        title: this.milestoneForm.title.trim(),
        description: this.milestoneForm.description.trim() || undefined,
        targetDate: this.milestoneForm.targetDate || undefined,
      });
      const data = this.unwrap<{ milestone: CareerMilestoneDTO }>(res);
      const current = this.getMilestones(goalId);
      if (data.milestone) {
      this.milestonesByGoal[goalId] = [data.milestone, ...current];
        this.milestoneForm = defaultMilestoneForm();
        this.success = "Milestone created.";
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to create milestone.";
    } finally {
      this.loading = false;
    }
  }

  async setMilestoneStatus(milestone: CareerMilestoneDTO, status: "todo" | "doing" | "done") {
    const goalId = milestone.goalId;
    const current = this.getMilestones(goalId);
    const prevStatus = milestone.status;
    this.milestonesByGoal[goalId] = current.map((item) =>
      item.id === milestone.id ? { ...item, status } : item,
    );

    try {
      const res = await actions.careerPlanner.setMilestoneStatus({ id: milestone.id, status });
      const data = this.unwrap<{ milestone: CareerMilestoneDTO; notice?: CareerNotice }>(res);
      this.milestonesByGoal[goalId] = current.map((item) =>
        item.id === data.milestone.id ? data.milestone : item,
      );
      this.setNotice(data.notice ?? null);
    } catch (err: any) {
      this.milestonesByGoal[goalId] = current.map((item) =>
        item.id === milestone.id ? { ...item, status: prevStatus } : item,
      );
      this.error = err?.message || "Unable to update milestone.";
    }
  }

  async createTask(milestoneId: number) {
    if (!this.taskForm.title.trim()) {
      this.error = "Task title is required.";
      return;
    }
    this.loading = true;
    this.error = null;
    this.success = null;
    try {
      const res = await actions.careerPlanner.createTask({
        milestoneId,
        title: this.taskForm.title.trim(),
        notes: this.taskForm.notes.trim() || undefined,
        dueDate: this.taskForm.dueDate || undefined,
      });
      const data = this.unwrap<{ task: CareerTaskDTO }>(res);
      const current = this.getTasks(milestoneId);
      if (data.task) {
      this.tasksByMilestone[milestoneId] = [data.task, ...current];
        this.taskForm = defaultTaskForm();
        this.success = "Task created.";
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to create task.";
    } finally {
      this.loading = false;
    }
  }

  async setTaskStatus(task: CareerTaskDTO, status: "todo" | "doing" | "done") {
    const milestoneId = task.milestoneId;
    const current = this.getTasks(milestoneId);
    const prevStatus = task.status;
    this.tasksByMilestone[milestoneId] = current.map((item) =>
      item.id === task.id ? { ...item, status } : item,
    );

    try {
      const res = await actions.careerPlanner.setTaskStatus({ id: task.id, status });
      const data = this.unwrap<{ task: CareerTaskDTO }>(res);
      this.tasksByMilestone[milestoneId] = current.map((item) =>
        item.id === data.task.id ? data.task : item,
      );
    } catch (err: any) {
      this.tasksByMilestone[milestoneId] = current.map((item) =>
        item.id === task.id ? { ...item, status: prevStatus } : item,
      );
      this.error = err?.message || "Unable to update task.";
    }
  }
}

export const registerCareerPlannerStore = (Alpine: Alpine) => {
  Alpine.store("careerPlanner", new CareerPlannerStore());
};
