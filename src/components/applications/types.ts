import type { Stage, WorkMode } from "@/lib/domain";
import type { QuickFilter } from "@/lib/domain";

export type ViewMode = "table" | "kanban";

export type SortKey = "applied_at" | "waiting" | "priority" | "deadline" | "company";

export type AppsSearch = {
  view?: ViewMode;
  q?: string;
  quick?: QuickFilter;
  sort?: SortKey;
  stage?: Stage;
  company?: string;
  location?: string;
  country?: string;
  industry?: string;
  type?: string;
  mode?: WorkMode;
  cv?: string;
  source?: string;
  priority?: string;
  appliedFrom?: string;
  appliedTo?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
};

export const DEFAULT_SEARCH: Required<Pick<AppsSearch, "view" | "quick" | "sort">> = {
  view: "table",
  quick: "all",
  sort: "applied_at",
};
