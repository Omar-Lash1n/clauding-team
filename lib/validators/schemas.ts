import { z } from "zod";
import { nidSchema } from "./nid";

// Egyptian phone number
const egyptianPhone = z
  .string()
  .regex(/^\+201[0-9]{9}$/, "Phone must be in format +201XXXXXXXXX");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  national_id: nidSchema,
  phone: egyptianPhone,
  email: z.string().email("Invalid email address"),
  password,
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const otpSchema = z.object({
  token: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type OtpInput = z.infer<typeof otpSchema>;

export const reportCreateSchema = z.object({
  category_id: z.string().uuid("Invalid category"),
  priority: z.enum(["critical", "high", "medium", "low", "scheduled"]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description too long"),
  address_description: z.string().max(500).optional(),
  location_lat: z
    .number()
    .min(-90)
    .max(90, "Invalid latitude"),
  location_lng: z
    .number()
    .min(-180)
    .max(180, "Invalid longitude"),
  photos: z.array(z.instanceof(File)).max(4, "Maximum 4 photos").optional(),
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

export const reportEditSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000)
    .optional(),
  address_description: z.string().max(500).optional(),
  priority: z
    .enum(["critical", "high", "medium", "low", "scheduled"])
    .optional(),
});

export type ReportEditInput = z.infer<typeof reportEditSchema>;

export const feedbackSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(500).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const disputeResolutionSchema = z.object({
  resolution: z.enum(["assign_new", "same_tech_again", "dispute_rejected"]),
  new_technician_id: z.string().uuid().optional().nullable(),
  dm_notes: z.string().max(500).optional(),
});

export type DisputeResolutionInput = z.infer<typeof disputeResolutionSchema>;

export const leaveRequestSchema = z.object({
  start_date: z.string().date("Invalid start date"),
  end_date: z.string().date("Invalid end date"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
  message: "End date must be after start date",
  path: ["end_date"],
});

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const crossDistrictSchema = z.object({
  target_district_id: z.string().uuid("Invalid district"),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
});

export type CrossDistrictInput = z.infer<typeof crossDistrictSchema>;

export const categoryUpsertSchema = z.object({
  name_en: z.string().min(2).max(100),
  name_ar: z.string().min(2).max(100),
  icon_name: z.string().min(1).max(50),
  default_specialty: z.enum([
    "plumber",
    "electrician",
    "road_maintenance",
    "sanitation",
    "general",
  ]),
  default_priority: z.enum([
    "critical",
    "high",
    "medium",
    "low",
    "scheduled",
  ]),
});

export type CategoryUpsertInput = z.infer<typeof categoryUpsertSchema>;
