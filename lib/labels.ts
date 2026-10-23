// Short, human words for database values. UI copy only; the values themselves come from the database.
import type { DevExposure, PartnershipStatus, PostStatus, RoleCategory, Setup, YesNoAsk } from "./types";

export const roleLabel: Record<RoleCategory, string> = {
  dev: "Dev",
  qa: "QA",
  it_support: "IT support",
  network: "Network",
  data: "Data",
  cyber: "Cyber",
  automation: "Automation",
  ui_ux: "UI/UX",
  business_analyst: "Business",
  other: "Other",
};

export const setupLabel: Record<Setup, string> = {
  onsite: "Onsite",
  hybrid: "Hybrid",
  remote: "Remote",
  unknown: "Setup unknown",
};

export const devLabel: Record<DevExposure, string> = {
  high: "Real dev work",
  some: "Some dev",
  low: "Little dev",
  low_repetitive: "Repetitive",
  unknown: "Work unclear",
};

export const postLabel: Record<PostStatus, string> = {
  open: "Open",
  recurring_program: "Recurring",
  unconfirmed: "Unconfirmed",
  no_post_cold_email: "No post",
  closed: "Closed",
};

export const novLabel: Record<YesNoAsk, string> = { yes: "Takes Nov start", no: "No Nov start", ask: "Ask about Nov" };

export const partnerLabel: Record<PartnershipStatus, string> = {
  listed_in_hte: "HTE partner",
  confirmed_by_school: "Confirmed partner",
  confirmed_by_company: "Confirmed by company",
  not_listed: "Not on HTE list",
  moa_requested: "MOA requested",
  needs_clarification: "Ask your FIC",
};

export type Tone = "good" | "warn" | "muted" | "bad";

export const partnerTone: Record<PartnershipStatus, Tone> = {
  listed_in_hte: "good",
  confirmed_by_school: "good",
  confirmed_by_company: "good",
  not_listed: "muted",
  moa_requested: "warn",
  needs_clarification: "warn",
};

export const postTone: Record<PostStatus, Tone> = {
  open: "good",
  recurring_program: "warn",
  unconfirmed: "muted",
  no_post_cold_email: "muted",
  closed: "bad",
};

export const devTone: Record<DevExposure, Tone> = {
  high: "good",
  some: "good",
  low: "muted",
  low_repetitive: "warn",
  unknown: "muted",
};
