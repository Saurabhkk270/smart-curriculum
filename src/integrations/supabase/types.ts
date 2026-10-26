export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          class_id: string
          content: string
          created_at: string
          deadline: string | null
          id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          content: string
          created_at?: string
          deadline?: string | null
          id?: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          content?: string
          created_at?: string
          deadline?: string | null
          id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          device_info: string | null
          id: string
          is_manual: boolean
          marked_at: string
          marked_by: string
          scan_location: string | null
          session_id: string
          student_id: string
          status: string | null
          leave_proof_url: string | null
        }
        Insert: {
          device_info?: string | null
          id?: string
          is_manual?: boolean
          marked_at?: string
          marked_by: string
          scan_location?: string | null
          session_id: string
          student_id: string
          status?: string | null
          leave_proof_url?: string | null
        }
        Update: {
          device_info?: string | null
          id?: string
          is_manual?: boolean
          marked_at?: string
          marked_by?: string
          scan_location?: string | null
          session_id?: string
          student_id?: string
          status?: string | null
          leave_proof_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          qr_code_data: string
          session_date: string
          session_time: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          qr_code_data: string
          session_date?: string
          session_time?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          qr_code_data?: string
          session_date?: string
          session_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          id: string
          name: string
          exam_type: string
          academic_year: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          exam_type?: string
          academic_year?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          exam_type?: string
          academic_year?: string | null
          created_at?: string
        }
        Relationships: []
      }
      exam_schedules: {
        Row: {
          id: string
          exam_id: string
          class_id: string
          exam_date: string
          start_time: string
          end_time: string
          room_no: string
          max_marks: number
          passing_marks: number
          created_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          class_id: string
          exam_date: string
          start_time: string
          end_time: string
          room_no: string
          max_marks?: number
          passing_marks?: number
          created_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          class_id?: string
          exam_date?: string
          start_time?: string
          end_time?: string
          room_no?: string
          max_marks?: number
          passing_marks?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_schedules_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_results: {
        Row: {
          id: string
          schedule_id: string
          student_id: string
          marks_obtained: number
          grade: string
          status: string
          remarks: string | null
          created_at: string
        }
        Insert: {
          id?: string
          schedule_id: string
          student_id: string
          marks_obtained: number
          grade: string
          status?: string
          remarks?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          schedule_id?: string
          student_id?: string
          marks_obtained?: number
          grade?: string
          status?: string
          remarks?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "exam_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      holidays: {
        Row: {
          country: string | null
          created_at: string | null
          date: string
          id: string
          name: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          date: string
          id?: string
          name: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          date?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          priority: string
          target_audience: string
          department: string | null
          author_id: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: string
          target_audience?: string
          department?: string | null
          author_id?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: string
          target_audience?: string
          department?: string | null
          author_id?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          course: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          semester: string | null
          student_id: string | null
          updated_at: string
          account_status: string | null
          branch: string | null
          section: string | null
          admission_year: number | null
          roll_no: string | null
        }
        Insert: {
          course?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          semester?: string | null
          student_id?: string | null
          updated_at?: string
          account_status?: string | null
          branch?: string | null
          section?: string | null
          admission_year?: number | null
          roll_no?: string | null
        }
        Update: {
          course?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          semester?: string | null
          student_id?: string | null
          updated_at?: string
          account_status?: string | null
          branch?: string | null
          section?: string | null
          admission_year?: number | null
          roll_no?: string | null
        }
        Relationships: []
      }
      timetables: {
        Row: {
          course: string
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          semester: string
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          course?: string
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          semester?: string
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          course?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          semester?: string
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          department: string | null
          mentor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          department?: string | null
          mentor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          department?: string | null
          mentor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          student_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          student_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          student_id?: string
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          user_id: string | null
          category: string
          title: string
          content: string
          rating: number | null
          status: string
          admin_response: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          category?: string
          title: string
          content: string
          rating?: number | null
          status?: string
          admin_response?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          category?: string
          title?: string
          content?: string
          rating?: number | null
          status?: string
          admin_response?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      gallery_items: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          image_url: string
          event_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string
          image_url: string
          event_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          image_url?: string
          event_date?: string | null
          created_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          details?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      campus_settings: {
        Row: {
          id: string
          value: Json
          updated_at: string
        }
        Insert: {
          id: string
          value: Json
          updated_at?: string
        }
        Update: {
          id?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "teacher" | "admin"
      user_role: "student" | "teacher" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "teacher", "admin"],
      user_role: ["student", "teacher", "admin"],
    },
  },
} as const
