export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export type ProjectStatus =
  | "planning"
  | "pre_production"
  | "production"
  | "post_production"
  | "review"
  | "approved"
  | "delivered"
  | "completed";

export type ShootStatus = "planning" | "scheduled" | "ready" | "in_progress" | "completed" | "cancelled";
export type ShotStatus = "planned" | "ready" | "shot" | "retake" | "approved";
export type TaskStatus = "todo" | "in_progress" | "review" | "completed";
export type QuoteStatus = "draft" | "sent" | "viewed" | "approved" | "rejected" | "expired";
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type AssetStatus =
  | "uploaded"
  | "processing"
  | "internal_review"
  | "client_review"
  | "approved"
  | "delivered"
  | "archived";

export type RoleKey =
  | "super_admin"
  | "admin"
  | "production_manager"
  | "marketer"
  | "seo_specialist"
  | "accountant"
  | "team_member"
  | "client";
