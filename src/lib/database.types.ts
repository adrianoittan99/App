// Hand-written to match supabase/schema.sql. If the schema changes, update
// this file to match (or regenerate via `supabase gen types typescript`
// once the Supabase CLI is set up). Shape follows what the CLI itself
// generates (Relationships/Views/Functions included) so it satisfies
// supabase-js's GenericSchema constraint.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          current_age: number | null;
          theme: "dark" | "light";
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          current_age?: number | null;
          theme?: "dark" | "light";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "checking" | "savings" | "credit" | "investment" | "loan";
          balance: number;
          apr: number | null;
          minimum_payment: number | null;
          due_day: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "checking" | "savings" | "credit" | "investment" | "loan";
          balance?: number;
          apr?: number | null;
          minimum_payment?: number | null;
          due_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["accounts"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string | null;
          date: string;
          merchant: string;
          category: string;
          amount: number;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id?: string | null;
          date: string;
          merchant: string;
          category: string;
          amount: number;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      envelopes: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          monthly_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          monthly_limit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["envelopes"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          target: number;
          saved: number;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          target: number;
          saved?: number;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [];
      };
      canceled_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          merchant_key: string;
          canceled_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant_key: string;
          canceled_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["canceled_subscriptions"]["Insert"]>;
        Relationships: [];
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          merchant: string;
          category: string;
          amount: number;
          account_id: string | null;
          day_of_month: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant: string;
          category: string;
          amount: number;
          account_id?: string | null;
          day_of_month: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recurring_transactions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
