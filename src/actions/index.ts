import {
  archiveGoal,
  createGoal,
  createMilestone,
  createTask,
  getGoal,
  listGoals,
  listMilestonesByGoal,
  listTasksByMilestone,
  setMilestoneStatus,
  setTaskStatus,
  updateGoal,
  updateMilestone,
  updateTask,
} from "./careerPlanner";

export const careerPlanner = {
  createGoal,
  updateGoal,
  archiveGoal,
  listGoals,
  getGoal,
  createMilestone,
  updateMilestone,
  setMilestoneStatus,
  listMilestonesByGoal,
  createTask,
  updateTask,
  setTaskStatus,
  listTasksByMilestone,
};

export const server = {
  careerPlanner,
};
