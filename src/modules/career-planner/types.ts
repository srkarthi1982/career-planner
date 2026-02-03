export type CareerGoalDTO = {
  id: number;
  userId: string;
  title: string;
  targetRole?: string | null;
  notes?: string | null;
  status: "active" | "archived";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CareerMilestoneDTO = {
  id: number;
  userId: string;
  goalId: number;
  title: string;
  description?: string | null;
  targetDate?: string | Date | null;
  status: "todo" | "doing" | "done";
  completedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type CareerTaskDTO = {
  id: number;
  userId: string;
  milestoneId: number;
  title: string;
  notes?: string | null;
  dueDate?: string | Date | null;
  status: "todo" | "doing" | "done";
  completedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type GoalForm = {
  title: string;
  targetRole: string;
  notes: string;
};

export type MilestoneForm = {
  title: string;
  description: string;
  targetDate: string;
};

export type TaskForm = {
  title: string;
  notes: string;
  dueDate: string;
};

export type CareerNotice = {
  eventType: string;
  title: string;
  url: string;
};
