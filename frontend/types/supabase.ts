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
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          provider: string | null;
          created_at: string | null;
          last_seen_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string | null;
          last_seen_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string | null;
          last_seen_at?: string | null;
        };
      };
      user_canvases: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          nodes: Json;
          edges: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          user_id: string;
          name?: string;
          nodes?: Json;
          edges?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          nodes?: Json;
          edges?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      tutorial_response_cache: {
        Row: {
          question_hash: string;
          response: string;
          created_at: string | null;
        };
        Insert: {
          question_hash: string;
          response: string;
          created_at?: string | null;
        };
        Update: {
          question_hash?: string;
          response?: string;
          created_at?: string | null;
        };
      };
      tutorial_progress: {
        Row: {
          id: string;
          user_id: string;
          tutorial_id: string;
          current_level: number;
          current_step: number;
          current_phase: string;
          completed_levels: number[];
          canvas_nodes: Json;
          canvas_edges: Json;
          explain_count: number;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          tutorial_id: string;
          current_level?: number;
          current_step?: number;
          current_phase?: string;
          completed_levels?: number[];
          canvas_nodes?: Json;
          canvas_edges?: Json;
          explain_count?: number;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          tutorial_id?: string;
          current_level?: number;
          current_step?: number;
          current_phase?: string;
          completed_levels?: number[];
          canvas_nodes?: Json;
          canvas_edges?: Json;
          explain_count?: number;
          updated_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
