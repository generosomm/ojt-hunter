import type { ApplicationStatus } from "./schemas";

export const statusLabel: Record<ApplicationStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  assessment: "Assessment",
  interview: "Interview",
  offered: "Offered",
  accepted: "Accepted",
  declined: "Declined",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  closed: "Closed",
};

// the pipeline columns, then one column for everything that ended
export const PIPELINE: ApplicationStatus[] = ["saved", "applied", "assessment", "interview", "offered", "accepted"];
export const ENDED: ApplicationStatus[] = ["declined", "rejected", "withdrawn", "closed"];
