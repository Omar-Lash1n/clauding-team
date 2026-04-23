export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          default_priority: Database["public"]["Enums"]["priority_level"];
          default_specialty: Database["public"]["Enums"]["specialty_type"];
          icon_name: string;
          id: string;
          is_active: boolean;
          name_ar: string;
          name_en: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_priority?: Database["public"]["Enums"]["priority_level"];
          default_specialty?: Database["public"]["Enums"]["specialty_type"];
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          name_ar: string;
          name_en: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_priority?: Database["public"]["Enums"]["priority_level"];
          default_specialty?: Database["public"]["Enums"]["specialty_type"];
          icon_name?: string;
          id?: string;
          is_active?: boolean;
          name_ar?: string;
          name_en?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cross_district_requests: {
        Row: {
          approved_by_governor: string | null;
          created_at: string;
          decided_at: string | null;
          expires_at: string | null;
          id: string;
          reason: string;
          requesting_dm_id: string;
          status: Database["public"]["Enums"]["cross_district_status"];
          target_district_id: string;
        };
        Insert: {
          approved_by_governor?: string | null;
          created_at?: string;
          decided_at?: string | null;
          expires_at?: string | null;
          id?: string;
          reason: string;
          requesting_dm_id: string;
          status?: Database["public"]["Enums"]["cross_district_status"];
          target_district_id: string;
        };
        Update: {
          approved_by_governor?: string | null;
          created_at?: string;
          decided_at?: string | null;
          expires_at?: string | null;
          id?: string;
          reason?: string;
          requesting_dm_id?: string;
          status?: Database["public"]["Enums"]["cross_district_status"];
          target_district_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cross_district_requests_approved_by_governor_fkey";
            columns: ["approved_by_governor"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cross_district_requests_requesting_dm_id_fkey";
            columns: ["requesting_dm_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cross_district_requests_target_district_id_fkey";
            columns: ["target_district_id"];
            isOneToOne: false;
            referencedRelation: "districts";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_summaries: {
        Row: {
          created_at: string;
          id: string;
          new_reports_count: number;
          payload: Json;
          resolved_count: number;
          summary_date: string;
          top_delay_districts: Json | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          new_reports_count?: number;
          payload?: Json;
          resolved_count?: number;
          summary_date: string;
          top_delay_districts?: Json | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          new_reports_count?: number;
          payload?: Json;
          resolved_count?: number;
          summary_date?: string;
          top_delay_districts?: Json | null;
        };
        Relationships: [];
      };
      districts: {
        Row: {
          bounding_radius_km: number;
          center_lat: number;
          center_lng: number;
          created_at: string;
          id: string;
          name_ar: string;
          name_en: string;
        };
        Insert: {
          bounding_radius_km?: number;
          center_lat: number;
          center_lng: number;
          created_at?: string;
          id?: string;
          name_ar: string;
          name_en: string;
        };
        Update: {
          bounding_radius_km?: number;
          center_lat?: number;
          center_lng?: number;
          created_at?: string;
          id?: string;
          name_ar?: string;
          name_en?: string;
        };
        Relationships: [];
      };
      escalations: {
        Row: {
          acknowledged_at: string | null;
          created_at: string;
          escalated_to_user_id: string;
          escalation_type: Database["public"]["Enums"]["escalation_type"];
          id: string;
          report_id: string;
        };
        Insert: {
          acknowledged_at?: string | null;
          created_at?: string;
          escalated_to_user_id: string;
          escalation_type: Database["public"]["Enums"]["escalation_type"];
          id?: string;
          report_id: string;
        };
        Update: {
          acknowledged_at?: string | null;
          created_at?: string;
          escalated_to_user_id?: string;
          escalation_type?: Database["public"]["Enums"]["escalation_type"];
          id?: string;
          report_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "escalations_escalated_to_user_id_fkey";
            columns: ["escalated_to_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "escalations_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          }
        ];
      };
      leave_requests: {
        Row: {
          approved_by: string | null;
          created_at: string;
          decided_at: string | null;
          end_date: string;
          id: string;
          reason: string;
          start_date: string;
          status: Database["public"]["Enums"]["leave_status"];
          substitute_id: string | null;
          technician_id: string;
        };
        Insert: {
          approved_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
          end_date: string;
          id?: string;
          reason: string;
          start_date: string;
          status?: Database["public"]["Enums"]["leave_status"];
          substitute_id?: string | null;
          technician_id: string;
        };
        Update: {
          approved_by?: string | null;
          created_at?: string;
          decided_at?: string | null;
          end_date?: string;
          id?: string;
          reason?: string;
          start_date?: string;
          status?: Database["public"]["Enums"]["leave_status"];
          substitute_id?: string | null;
          technician_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_substitute_id_fkey";
            columns: ["substitute_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_technician_id_fkey";
            columns: ["technician_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          body_ar: string | null;
          body_en: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          link_url: string | null;
          title_ar: string;
          title_en: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          body_ar?: string | null;
          body_en?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link_url?: string | null;
          title_ar: string;
          title_en: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          body_ar?: string | null;
          body_en?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          link_url?: string | null;
          title_ar?: string;
          title_en?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          birth_date: string | null;
          created_at: string;
          district_id: string | null;
          email: string;
          employee_id: string | null;
          full_name: string;
          full_name_ar: string | null;
          gender: Database["public"]["Enums"]["gender_type"] | null;
          id: string;
          is_on_leave: boolean;
          national_id: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          specialty: Database["public"]["Enums"]["specialty_type"] | null;
          substitute_for_user_id: string | null;
          updated_at: string;
        };
        Insert: {
          birth_date?: string | null;
          created_at?: string;
          district_id?: string | null;
          email: string;
          employee_id?: string | null;
          full_name: string;
          full_name_ar?: string | null;
          gender?: Database["public"]["Enums"]["gender_type"] | null;
          id: string;
          is_on_leave?: boolean;
          national_id?: string | null;
          phone?: string | null;
          role: Database["public"]["Enums"]["user_role"];
          specialty?: Database["public"]["Enums"]["specialty_type"] | null;
          substitute_for_user_id?: string | null;
          updated_at?: string;
        };
        Update: {
          birth_date?: string | null;
          created_at?: string;
          district_id?: string | null;
          email?: string;
          employee_id?: string | null;
          full_name?: string;
          full_name_ar?: string | null;
          gender?: Database["public"]["Enums"]["gender_type"] | null;
          id?: string;
          is_on_leave?: boolean;
          national_id?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          specialty?: Database["public"]["Enums"]["specialty_type"] | null;
          substitute_for_user_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_district_id_fkey";
            columns: ["district_id"];
            isOneToOne: false;
            referencedRelation: "districts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_substitute_for_user_id_fkey";
            columns: ["substitute_for_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      report_disputes: {
        Row: {
          created_at: string;
          dm_notes: string | null;
          feedback_id: string;
          id: string;
          new_technician_id: string | null;
          report_id: string;
          resolution: Database["public"]["Enums"]["dispute_resolution"] | null;
          resolved_at: string | null;
          resolved_by_dm: string | null;
        };
        Insert: {
          created_at?: string;
          dm_notes?: string | null;
          feedback_id: string;
          id?: string;
          new_technician_id?: string | null;
          report_id: string;
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null;
          resolved_at?: string | null;
          resolved_by_dm?: string | null;
        };
        Update: {
          created_at?: string;
          dm_notes?: string | null;
          feedback_id?: string;
          id?: string;
          new_technician_id?: string | null;
          report_id?: string;
          resolution?: Database["public"]["Enums"]["dispute_resolution"] | null;
          resolved_at?: string | null;
          resolved_by_dm?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_disputes_feedback_id_fkey";
            columns: ["feedback_id"];
            isOneToOne: false;
            referencedRelation: "report_feedback";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_disputes_new_technician_id_fkey";
            columns: ["new_technician_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_disputes_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_disputes_resolved_by_dm_fkey";
            columns: ["resolved_by_dm"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      report_feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          report_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          report_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          report_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_feedback_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: true;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          }
        ];
      };
      report_photos: {
        Row: {
          id: string;
          photo_type: Database["public"]["Enums"]["photo_type"];
          report_id: string;
          storage_path: string;
          uploaded_at: string;
          uploaded_by: string;
        };
        Insert: {
          id?: string;
          photo_type: Database["public"]["Enums"]["photo_type"];
          report_id: string;
          storage_path: string;
          uploaded_at?: string;
          uploaded_by: string;
        };
        Update: {
          id?: string;
          photo_type?: Database["public"]["Enums"]["photo_type"];
          report_id?: string;
          storage_path?: string;
          uploaded_at?: string;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "report_photos_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "report_photos_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          address_description: string | null;
          approved_at: string | null;
          approved_by: string | null;
          archived_at: string | null;
          assigned_at: string | null;
          assigned_technician_id: string | null;
          category_id: string;
          description: string;
          district_id: string;
          escalated_at: string | null;
          id: string;
          is_public: boolean;
          location_lat: number;
          location_lng: number;
          priority: Database["public"]["Enums"]["priority_level"];
          rejected_reason: string | null;
          reporter_id: string;
          resolved_at: string | null;
          resolved_cost: number | null;
          sla_pickup_deadline: string | null;
          sla_resolve_deadline: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["report_status"];
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          address_description?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          assigned_at?: string | null;
          assigned_technician_id?: string | null;
          category_id: string;
          description: string;
          district_id: string;
          escalated_at?: string | null;
          id?: string;
          is_public?: boolean;
          location_lat: number;
          location_lng: number;
          priority?: Database["public"]["Enums"]["priority_level"];
          rejected_reason?: string | null;
          reporter_id: string;
          resolved_at?: string | null;
          resolved_cost?: number | null;
          sla_pickup_deadline?: string | null;
          sla_resolve_deadline?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          address_description?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          archived_at?: string | null;
          assigned_at?: string | null;
          assigned_technician_id?: string | null;
          category_id?: string;
          description?: string;
          district_id?: string;
          escalated_at?: string | null;
          id?: string;
          is_public?: boolean;
          location_lat?: number;
          location_lng?: number;
          priority?: Database["public"]["Enums"]["priority_level"];
          rejected_reason?: string | null;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_cost?: number | null;
          sla_pickup_deadline?: string | null;
          sla_resolve_deadline?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_approved_by_fkey";
            columns: ["approved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_assigned_technician_id_fkey";
            columns: ["assigned_technician_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_district_id_fkey";
            columns: ["district_id"];
            isOneToOne: false;
            referencedRelation: "districts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      v_district_stats: {
        Row: {
          active_count: number | null;
          avg_resolution_hours: number | null;
          completed_count: number | null;
          district_id: string | null;
          escalation_count: number | null;
          name_ar: string | null;
          name_en: string | null;
          rejected_count: number | null;
          submitted_count: number | null;
          total_spent: number | null;
        };
        Relationships: [];
      };
      v_heatmap_points: {
        Row: {
          district_id: string | null;
          id: string | null;
          location_lat: number | null;
          location_lng: number | null;
          priority: Database["public"]["Enums"]["priority_level"] | null;
          status: Database["public"]["Enums"]["report_status"] | null;
          weight: number | null;
        };
        Relationships: [];
      };
      v_technician_workload: {
        Row: {
          active_tasks: number | null;
          district_id: string | null;
          full_name: string | null;
          full_name_ar: string | null;
          is_on_leave: boolean | null;
          specialty: Database["public"]["Enums"]["specialty_type"] | null;
          technician_id: string | null;
          workload_score: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      auto_archive_stale_resolved: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      auto_assign_substitute: {
        Args: { p_leave_id: string };
        Returns: string | null;
      };
      current_district: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      current_role_name: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["user_role"];
      };
      find_nearby_active_reports: {
        Args: {
          p_lat: number;
          p_lng: number;
          p_category_id: string;
          p_radius_meters?: number;
        };
        Returns: {
          id: string;
          description: string;
          status: Database["public"]["Enums"]["report_status"];
          submitted_at: string;
          distance_meters: number;
        }[];
      };
      pick_least_busy_technician: {
        Args: {
          p_district_id: string;
          p_specialty: Database["public"]["Enums"]["specialty_type"];
        };
        Returns: {
          technician_id: string;
          full_name: string;
          workload_score: number;
          active_tasks: number;
        }[];
      };
      sla_escalation_sweep: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
    Enums: {
      cross_district_status: "pending" | "approved" | "rejected" | "expired";
      dispute_resolution:
        | "assign_new"
        | "same_tech_again"
        | "dispute_rejected";
      escalation_type:
        | "pickup_missed"
        | "resolve_missed"
        | "critical_unassigned";
      gender_type: "male" | "female";
      leave_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "completed";
      notification_type:
        | "report_status_change"
        | "report_assigned"
        | "report_resolved"
        | "feedback_request"
        | "dispute_filed"
        | "escalation"
        | "leave_decision"
        | "cross_district_decision"
        | "new_task"
        | "generic";
      photo_type: "before" | "after";
      priority_level: "critical" | "high" | "medium" | "low" | "scheduled";
      report_status:
        | "submitted"
        | "approved"
        | "rejected"
        | "cancelled"
        | "assigned"
        | "in_progress"
        | "resolved"
        | "rated"
        | "disputed"
        | "archived";
      specialty_type:
        | "plumber"
        | "electrician"
        | "road_maintenance"
        | "sanitation"
        | "general";
      user_role:
        | "citizen"
        | "technician"
        | "district_manager"
        | "governor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
