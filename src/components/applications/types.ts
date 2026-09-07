import type { Stage, WorkMode } from "@/lib/domain";
import type { QuickFilter } from "@/lib/domain";

export type ViewMode = "table" | "kanban";

export type SortKey = "applied_at" | "waiting" | "priority" | "deadline" | "company";

export type AppsSearch = {
  view?: ViewMode | undefined;
  q?: string | undefined;
  quick?: QuickFilter | undefined;
  sort?: SortKey | undefined;
  stage?: Stage | undefined;
  company?: string | undefined;
  location?: string | undefined;
  country?: string | undefined;
  industry?: string | undefined;
  type?: string | undefined;
  mode?: WorkMode | undefined;
  cv?: string | undefined;
  source?: string | undefined;
  priority?: string | undefined;
  appliedFrom?: string | undefined;
  appliedTo?: string | undefined;
  deadlineFrom?: string | undefined;
  deadlineTo?: string | undefined;
};

export const DEFAULT_SEARCH: Required<Pick<AppsSearch, "view" | "quick" | "sort">> = {
  view: "table",
  quick: "all",
  sort: "applied_at",
};
