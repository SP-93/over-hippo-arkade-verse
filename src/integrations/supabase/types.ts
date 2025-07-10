export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_by_system: boolean | null
          email: string
          failure_count: number
          id: string
          last_attempt_ip: string | null
          locked_at: string
          locked_until: string
        }
        Insert: {
          created_by_system?: boolean | null
          email: string
          failure_count?: number
          id?: string
          last_attempt_ip?: string | null
          locked_at?: string
          locked_until: string
        }
        Update: {
          created_by_system?: boolean | null
          email?: string
          failure_count?: number
          id?: string
          last_attempt_ip?: string | null
          locked_at?: string
          locked_until?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action_details: Json | null
          action_type: string
          admin_user_id: string | null
          admin_wallet_address: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          target_user_id: string | null
          target_wallet_address: string | null
          user_agent: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          admin_user_id?: string | null
          admin_wallet_address: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          target_user_id?: string | null
          target_wallet_address?: string | null
          user_agent?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          admin_user_id?: string | null
          admin_wallet_address?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          target_user_id?: string | null
          target_wallet_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          admin_role: string
          admin_wallet_address: string
          created_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
        }
        Insert: {
          admin_role?: string
          admin_wallet_address: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
        }
        Update: {
          admin_role?: string
          admin_wallet_address?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
        }
        Relationships: []
      }
      admin_rate_limit: {
        Row: {
          action_type: string
          admin_wallet_address: string
          blocked_until: string | null
          created_at: string | null
          id: string
          last_request: string | null
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          action_type: string
          admin_wallet_address: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_request?: string | null
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          action_type?: string
          admin_wallet_address?: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_request?: string | null
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          admin_wallet_address: string
          created_at: string | null
          device_fingerprint: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string | null
          last_seen_ip: string | null
          login_location: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          admin_wallet_address: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          last_seen_ip?: string | null
          login_location?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          admin_wallet_address?: string
          created_at?: string | null
          device_fingerprint?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string | null
          last_seen_ip?: string | null
          login_location?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_failed_attempts: {
        Row: {
          attempt_time: string
          device_fingerprint: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          device_fingerprint?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          device_fingerprint?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      blockchain_transactions: {
        Row: {
          amount_chips: number | null
          amount_over: number | null
          block_number: number | null
          confirmed_at: string | null
          created_at: string | null
          game_type: string | null
          gas_price: number | null
          gas_used: number | null
          id: string
          status: string | null
          transaction_hash: string
          transaction_type: string
          wallet_address: string
        }
        Insert: {
          amount_chips?: number | null
          amount_over?: number | null
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          game_type?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          status?: string | null
          transaction_hash: string
          transaction_type: string
          wallet_address: string
        }
        Update: {
          amount_chips?: number | null
          amount_over?: number | null
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          game_type?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          status?: string | null
          transaction_hash?: string
          transaction_type?: string
          wallet_address?: string
        }
        Relationships: []
      }
      chip_transactions: {
        Row: {
          chip_amount: number
          created_at: string
          feature_type: string | null
          game_type: string | null
          id: string
          over_amount: number | null
          premium_type: string | null
          status: string | null
          transaction_hash: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          chip_amount: number
          created_at?: string
          feature_type?: string | null
          game_type?: string | null
          id?: string
          over_amount?: number | null
          premium_type?: string | null
          status?: string | null
          transaction_hash?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          chip_amount?: number
          created_at?: string
          feature_type?: string | null
          game_type?: string | null
          id?: string
          over_amount?: number | null
          premium_type?: string | null
          status?: string | null
          transaction_hash?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          file_path: string | null
          generated_at: string
          generated_by: string | null
          id: string
          metadata: Json | null
          period_end: string | null
          period_start: string | null
          report_data: Json
          report_name: string
          report_type: string
          status: string | null
        }
        Insert: {
          file_path?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          report_data: Json
          report_name: string
          report_type: string
          status?: string | null
        }
        Update: {
          file_path?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string | null
          period_start?: string | null
          report_data?: Json
          report_name?: string
          report_type?: string
          status?: string | null
        }
        Relationships: []
      }
      game_performance: {
        Row: {
          created_at: string
          device_info: Json | null
          fps_average: number | null
          game_type: string
          id: string
          memory_usage_mb: number | null
          render_time_ms: number | null
          session_id: string | null
          user_id: string | null
          webgl_version: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          fps_average?: number | null
          game_type: string
          id?: string
          memory_usage_mb?: number | null
          render_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
          webgl_version?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          fps_average?: number | null
          game_type?: string
          id?: string
          memory_usage_mb?: number | null
          render_time_ms?: number | null
          session_id?: string | null
          user_id?: string | null
          webgl_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_performance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          bonus_points: number | null
          combo_multiplier: number | null
          created_at: string
          game_type: string
          id: string
          level_reached: number | null
          over_earned: number | null
          real_time_score: number | null
          score: number
          session_id: string | null
          time_played: number | null
          user_id: string
        }
        Insert: {
          bonus_points?: number | null
          combo_multiplier?: number | null
          created_at?: string
          game_type: string
          id?: string
          level_reached?: number | null
          over_earned?: number | null
          real_time_score?: number | null
          score: number
          session_id?: string | null
          time_played?: number | null
          user_id: string
        }
        Update: {
          bonus_points?: number | null
          combo_multiplier?: number | null
          created_at?: string
          game_type?: string
          id?: string
          level_reached?: number | null
          over_earned?: number | null
          real_time_score?: number | null
          score?: number
          session_id?: string | null
          time_played?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          chip_consumed: boolean
          created_at: string
          game_type: string
          id: string
          is_paused: boolean | null
          last_activity: string
          lives_remaining: number
          score: number | null
          session_end: string | null
          session_start: string
          session_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chip_consumed?: boolean
          created_at?: string
          game_type: string
          id?: string
          is_paused?: boolean | null
          last_activity?: string
          lives_remaining?: number
          score?: number | null
          session_end?: string | null
          session_start?: string
          session_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chip_consumed?: boolean
          created_at?: string
          game_type?: string
          id?: string
          is_paused?: boolean | null
          last_activity?: string
          lives_remaining?: number
          score?: number | null
          session_end?: string | null
          session_start?: string
          session_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      operation_locks: {
        Row: {
          expires_at: string | null
          id: string
          lock_key: string
          locked_at: string | null
          locked_by: string
          metadata: Json | null
          operation_type: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          lock_key: string
          locked_at?: string | null
          locked_by: string
          metadata?: Json | null
          operation_type: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          lock_key?: string
          locked_at?: string | null
          locked_by?: string
          metadata?: Json | null
          operation_type?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          tags: Json | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at?: string
          tags?: Json | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          tags?: Json | null
        }
        Relationships: []
      }
      player_balances: {
        Row: {
          created_at: string | null
          game_chips: number | null
          id: string
          last_updated: string | null
          over_balance: number | null
          total_earnings: number | null
          wallet_address: string
        }
        Insert: {
          created_at?: string | null
          game_chips?: number | null
          id?: string
          last_updated?: string | null
          over_balance?: number | null
          total_earnings?: number | null
          wallet_address: string
        }
        Update: {
          created_at?: string | null
          game_chips?: number | null
          id?: string
          last_updated?: string | null
          over_balance?: number | null
          total_earnings?: number | null
          wallet_address?: string
        }
        Relationships: []
      }
      premium_features: {
        Row: {
          created_at: string
          expires_at: string | null
          feature_data: Json | null
          feature_type: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          feature_data?: Json | null
          feature_type: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          feature_data?: Json | null
          feature_type?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          over_balance: number | null
          updated_at: string
          user_id: string
          verified_wallet_address: string | null
          vip_expires_at: string | null
          vip_status: boolean | null
          wallet_address: string | null
          wallet_verified_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          over_balance?: number | null
          updated_at?: string
          user_id: string
          verified_wallet_address?: string | null
          vip_expires_at?: string | null
          vip_status?: boolean | null
          wallet_address?: string | null
          wallet_verified_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          over_balance?: number | null
          updated_at?: string
          user_id?: string
          verified_wallet_address?: string | null
          vip_expires_at?: string | null
          vip_status?: boolean | null
          wallet_address?: string | null
          wallet_verified_at?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_user_id: string | null
          assigned_to: string | null
          created_by: string | null
          description: string | null
          detected_at: string
          id: string
          incident_data: Json
          incident_type: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          title: string
        }
        Insert: {
          affected_user_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          description?: string | null
          detected_at?: string
          id?: string
          incident_data: Json
          incident_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title: string
        }
        Update: {
          affected_user_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          description?: string | null
          detected_at?: string
          id?: string
          incident_data?: Json
          incident_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          final_score: number | null
          id: string
          joined_at: string
          prize_won: number | null
          rank: number | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          final_score?: number | null
          id?: string
          joined_at?: string
          prize_won?: number | null
          rank?: number | null
          tournament_id: string
          user_id: string
        }
        Update: {
          final_score?: number | null
          id?: string
          joined_at?: string
          prize_won?: number | null
          rank?: number | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          end_time: string
          entry_fee: number
          entry_fee_over: number | null
          game_type: string
          id: string
          max_participants: number | null
          name: string
          premium_tournament: boolean | null
          prize_pool: number
          start_time: string
          status: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          entry_fee: number
          entry_fee_over?: number | null
          game_type: string
          id?: string
          max_participants?: number | null
          name: string
          premium_tournament?: boolean | null
          prize_pool: number
          start_time: string
          status?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          entry_fee?: number
          entry_fee_over?: number | null
          game_type?: string
          id?: string
          max_participants?: number | null
          name?: string
          premium_tournament?: boolean | null
          prize_pool?: number
          start_time?: string
          status?: string | null
        }
        Relationships: []
      }
      user_behavior_analytics: {
        Row: {
          action_details: Json
          action_type: string
          anomaly_detected: boolean | null
          created_at: string
          device_fingerprint: string | null
          geo_location: Json | null
          id: string
          ip_address: string | null
          risk_score: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_details: Json
          action_type: string
          anomaly_detected?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json
          action_type?: string
          anomaly_detected?: boolean | null
          created_at?: string
          device_fingerprint?: string | null
          geo_location?: Json | null
          id?: string
          ip_address?: string | null
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      wallet_verifications: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          banned_by_admin_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_banned: boolean | null
          message: string
          signature: string
          user_id: string | null
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by_admin_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_banned?: boolean | null
          message: string
          signature: string
          user_id?: string | null
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by_admin_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_banned?: boolean | null
          message?: string
          signature?: string
          user_id?: string | null
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      atomic_balance_operation: {
        Args: {
          p_operation_type: string
          p_amount: number
          p_over_amount?: number
          p_game_type?: string
          p_transaction_ref?: string
        }
        Returns: Json
      }
      check_admin_rate_limit: {
        Args: {
          p_admin_wallet: string
          p_action_type: string
          p_max_requests?: number
          p_window_minutes?: number
        }
        Returns: Json
      }
      check_wallet_exclusivity: {
        Args: { p_wallet_address: string; p_user_id: string }
        Returns: boolean
      }
      create_admin_session: {
        Args: {
          p_admin_wallet: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: Json
      }
      decrement_over: {
        Args: { wallet_addr: string; amount: number }
        Returns: number
      }
      end_game_session: {
        Args: { p_session_id: string; p_final_score?: number }
        Returns: boolean
      }
      generate_compliance_report: {
        Args: {
          p_report_type: string
          p_period_start: string
          p_period_end: string
        }
        Returns: Json
      }
      get_admin_audit_logs: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          admin_wallet_address: string
          action_type: string
          target_wallet_address: string
          action_details: Json
          success: boolean
          error_message: string
          created_at: string
        }[]
      }
      get_secure_wallet_balance: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      increment_chips: {
        Args: { wallet_addr: string; amount: number }
        Returns: number
      }
      increment_earnings: {
        Args: { wallet_addr: string; amount: number }
        Returns: number
      }
      increment_over: {
        Args: { wallet_addr: string; amount: number }
        Returns: number
      }
      is_account_locked: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_admin_wallet: {
        Args: { wallet_address: string }
        Returns: boolean
      }
      is_admin_wallet_with_logging: {
        Args: { wallet_address: string }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          p_action_type: string
          p_target_user_id?: string
          p_target_wallet_address?: string
          p_action_details?: Json
          p_success?: boolean
          p_error_message?: string
        }
        Returns: string
      }
      log_admin_check: {
        Args: { wallet_address: string }
        Returns: boolean
      }
      log_user_behavior: {
        Args: {
          p_action_type: string
          p_action_details: Json
          p_session_id?: string
          p_ip_address?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      lose_life: {
        Args: { p_session_id: string }
        Returns: Json
      }
      purchase_premium_chips: {
        Args: {
          p_chip_amount: number
          p_over_cost: number
          p_premium_type?: string
        }
        Returns: Json
      }
      purchase_vip_status: {
        Args: { p_duration_days?: number }
        Returns: Json
      }
      record_failed_login: {
        Args: {
          p_email: string
          p_ip_address?: string
          p_user_agent?: string
          p_failure_reason?: string
          p_device_fingerprint?: string
        }
        Returns: Json
      }
      record_performance_metric: {
        Args: {
          p_metric_type: string
          p_metric_name: string
          p_metric_value: number
          p_metric_unit?: string
          p_tags?: Json
        }
        Returns: undefined
      }
      start_game_session: {
        Args: { p_game_type: string; p_session_token: string }
        Returns: Json
      }
      unban_wallet: {
        Args: { p_wallet_address: string; p_admin_user_id: string }
        Returns: boolean
      }
      unlock_account: {
        Args: { p_email: string }
        Returns: boolean
      }
      update_realtime_score: {
        Args: {
          p_session_id: string
          p_score: number
          p_combo_multiplier?: number
          p_bonus_points?: number
        }
        Returns: Json
      }
      validate_admin_session: {
        Args: { p_session_token: string; p_admin_wallet: string }
        Returns: Json
      }
      verify_wallet_signature: {
        Args: {
          p_wallet_address: string
          p_message: string
          p_signature: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
