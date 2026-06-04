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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          aadhaar_number: string
          address: string
          alternate_mobile: string | null
          application_id: string
          branch_name: string | null
          branch_preferences: Json
          category: string
          city_preference: string | null
          college_name: string
          college_preferences: Json
          created_at: string
          district: string
          dob: string
          documents_status: Json
          email: string
          father_name: string
          full_name: string
          gap_year: string | null
          gender: string
          id: string
          mobile: string
          mother_name: string
          parent_signature_name: string | null
          pcm_pcb_percentage: string | null
          pincode: string
          scholarship_details: string | null
          service_selected: string | null
          state: string
          status: Database["public"]["Enums"]["application_status"]
          stream: string
          tenth_board: string | null
          tenth_percentage: string | null
          tenth_year: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          twelfth_board: string | null
          twelfth_percentage: string | null
          twelfth_stream: string | null
          twelfth_year: string | null
          updated_at: string
          witness_name: string | null
        }
        Insert: {
          aadhaar_number: string
          address: string
          alternate_mobile?: string | null
          application_id: string
          branch_name?: string | null
          branch_preferences?: Json
          category: string
          city_preference?: string | null
          college_name: string
          college_preferences?: Json
          created_at?: string
          district: string
          dob: string
          documents_status?: Json
          email: string
          father_name: string
          full_name: string
          gap_year?: string | null
          gender: string
          id?: string
          mobile: string
          mother_name: string
          parent_signature_name?: string | null
          pcm_pcb_percentage?: string | null
          pincode: string
          scholarship_details?: string | null
          service_selected?: string | null
          state: string
          status?: Database["public"]["Enums"]["application_status"]
          stream: string
          tenth_board?: string | null
          tenth_percentage?: string | null
          tenth_year?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          twelfth_board?: string | null
          twelfth_percentage?: string | null
          twelfth_stream?: string | null
          twelfth_year?: string | null
          updated_at?: string
          witness_name?: string | null
        }
        Update: {
          aadhaar_number?: string
          address?: string
          alternate_mobile?: string | null
          application_id?: string
          branch_name?: string | null
          branch_preferences?: Json
          category?: string
          city_preference?: string | null
          college_name?: string
          college_preferences?: Json
          created_at?: string
          district?: string
          dob?: string
          documents_status?: Json
          email?: string
          father_name?: string
          full_name?: string
          gap_year?: string | null
          gender?: string
          id?: string
          mobile?: string
          mother_name?: string
          parent_signature_name?: string | null
          pcm_pcb_percentage?: string | null
          pincode?: string
          scholarship_details?: string | null
          service_selected?: string | null
          state?: string
          status?: Database["public"]["Enums"]["application_status"]
          stream?: string
          tenth_board?: string | null
          tenth_percentage?: string | null
          tenth_year?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          twelfth_board?: string | null
          twelfth_percentage?: string | null
          twelfth_stream?: string | null
          twelfth_year?: string | null
          updated_at?: string
          witness_name?: string | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          is_used: boolean
          otp_code: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          is_used?: boolean
          otp_code: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean
          otp_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_application_id: { Args: never; Returns: string }
    }
    Enums: {
      application_status: "pending" | "under_review" | "approved" | "rejected"
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
      application_status: ["pending", "under_review", "approved", "rejected"],
    },
  },
} as const
