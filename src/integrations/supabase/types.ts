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
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
          workshop_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          workshop_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          document_number: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      damages: {
        Row: {
          created_at: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          description: string | null
          id: string
          inspection_area_id: string | null
          inspection_id: string
          photo_id: string | null
          position_x: number | null
          position_y: number | null
        }
        Insert: {
          created_at?: string
          damage_type: Database["public"]["Enums"]["damage_type"]
          description?: string | null
          id?: string
          inspection_area_id?: string | null
          inspection_id: string
          photo_id?: string | null
          position_x?: number | null
          position_y?: number | null
        }
        Update: {
          created_at?: string
          damage_type?: Database["public"]["Enums"]["damage_type"]
          description?: string | null
          id?: string
          inspection_area_id?: string | null
          inspection_id?: string
          photo_id?: string | null
          position_x?: number | null
          position_y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "damages_inspection_area_id_fkey"
            columns: ["inspection_area_id"]
            isOneToOne: false
            referencedRelation: "inspection_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damages_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damages_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_areas: {
        Row: {
          area_name: string
          created_at: string
          has_damage: boolean
          id: string
          inspection_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          area_name: string
          created_at?: string
          has_damage?: boolean
          id?: string
          inspection_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          area_name?: string
          created_at?: string
          has_damage?: boolean
          id?: string
          inspection_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_areas_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          client_id: string
          created_at: string
          entry_datetime: string
          finalized_at: string | null
          id: string
          service_type: string | null
          status: Database["public"]["Enums"]["inspection_status"]
          unique_code: string
          updated_at: string
          user_id: string | null
          vehicle_id: string
          version: number
          workshop_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          entry_datetime?: string
          finalized_at?: string | null
          id?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          unique_code: string
          updated_at?: string
          user_id?: string | null
          vehicle_id: string
          version?: number
          workshop_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          entry_datetime?: string
          finalized_at?: string | null
          id?: string
          service_type?: string | null
          status?: Database["public"]["Enums"]["inspection_status"]
          unique_code?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string
          version?: number
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          id: string
          inspection_area_id: string | null
          inspection_id: string
          marked_url: string | null
          original_url: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_area_id?: string | null
          inspection_id: string
          marked_url?: string | null
          original_url: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_area_id?: string | null
          inspection_id?: string
          marked_url?: string | null
          original_url?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_inspection_area_id_fkey"
            columns: ["inspection_area_id"]
            isOneToOne: false
            referencedRelation: "inspection_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          workshop_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workshop_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          inspection_id: string
          pdf_url: string | null
          public_url: string | null
          unique_code: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          inspection_id: string
          pdf_url?: string | null
          public_url?: string | null
          unique_code: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          inspection_id?: string
          pdf_url?: string | null
          public_url?: string | null
          unique_code?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          client_name: string
          created_at: string
          id: string
          inspection_id: string
          ip_address: string | null
          signature_url: string
          signed_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          inspection_id: string
          ip_address?: string | null
          signature_url: string
          signed_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          inspection_id?: string
          ip_address?: string | null
          signature_url?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: true
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string | null
          client_id: string | null
          color: string | null
          created_at: string
          id: string
          mileage: number | null
          model: string | null
          plate: string
          updated_at: string
          workshop_id: string
          year: number | null
        }
        Insert: {
          brand?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          model?: string | null
          plate: string
          updated_at?: string
          workshop_id: string
          year?: number | null
        }
        Update: {
          brand?: string | null
          client_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          mileage?: number | null
          model?: string | null
          plate?: string
          updated_at?: string
          workshop_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          responsible_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          responsible_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_workshop_id: { Args: never; Returns: string }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "attendant" | "mechanic" | "inspector"
      damage_type:
        | "risco"
        | "amassado"
        | "ralado"
        | "trinca"
        | "peca_quebrada"
        | "peca_faltando"
        | "mancha"
        | "vidro_trincado"
        | "roda_arranhada"
        | "farol_danificado"
        | "outro"
      inspection_status: "draft" | "in_progress" | "finalized"
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
      app_role: ["admin", "attendant", "mechanic", "inspector"],
      damage_type: [
        "risco",
        "amassado",
        "ralado",
        "trinca",
        "peca_quebrada",
        "peca_faltando",
        "mancha",
        "vidro_trincado",
        "roda_arranhada",
        "farol_danificado",
        "outro",
      ],
      inspection_status: ["draft", "in_progress", "finalized"],
    },
  },
} as const
