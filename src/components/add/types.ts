import type { Stage, WorkMode } from "@/lib/domain";

/** Estado acumulado a lo largo del asistente de alta de candidaturas. */
export type FlowDetails = {
  companyId: string;
  newCompanyName: string;
  roleTitle: string;
  location: string;
  country: string;
  description: string;
  requirements: string;
  salaryMin: string;
  salaryMax: string;
  deadlineAt: string;
  startDate: string;
  durationMonths: string;
  workMode: WorkMode | "";
  applicationType: string;
  jobUrl: string;
  source: string;
  externalId: string;
};

export type AppliedDetails = {
  appliedAt: string;
  cvId: string;
  coverLetterSent: boolean;
  coverLetterId: string;
  candidatePortalUrl: string;
  applicationRef: string;
  portalUsername: string;
  portalPasswordRef: string;
  stage: Stage;
};

export type SavedDetails = {
  priority: string;
  whyInterested: string;
  cvId: string;
  applicationPlan: string;
};

export const NEW_COMPANY = "__new__";

export function emptyFlowDetails(): FlowDetails {
  return {
    companyId: "",
    newCompanyName: "",
    roleTitle: "",
    location: "",
    country: "",
    description: "",
    requirements: "",
    salaryMin: "",
    salaryMax: "",
    deadlineAt: "",
    startDate: "",
    durationMonths: "",
    workMode: "",
    applicationType: "",
    jobUrl: "",
    source: "",
    externalId: "",
  };
}

export function emptyAppliedDetails(): AppliedDetails {
  return {
    appliedAt: new Date().toISOString().slice(0, 10),
    cvId: "",
    coverLetterSent: false,
    coverLetterId: "",
    candidatePortalUrl: "",
    applicationRef: "",
    portalUsername: "",
    portalPasswordRef: "",
    stage: "applied",
  };
}

export function emptySavedDetails(): SavedDetails {
  return { priority: "medium", whyInterested: "", cvId: "", applicationPlan: "" };
}
