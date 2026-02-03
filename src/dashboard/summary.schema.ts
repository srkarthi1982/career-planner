export type CareerPlannerDashboardSummaryV1 = {
  appId: "career-planner";
  version: 1;
  updatedAt: string;
  itemsCount: number;
  lastItemAt: string | null;
};

export const buildCareerPlannerSummary = async (): Promise<CareerPlannerDashboardSummaryV1> => {
  return {
    appId: "career-planner",
    version: 1,
    updatedAt: new Date().toISOString(),
    itemsCount: 0,
    lastItemAt: null,
  };
};
