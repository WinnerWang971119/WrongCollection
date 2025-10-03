export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          parent_id: string | null
          level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          parent_id?: string | null
          level: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          parent_id?: string | null
          level?: number
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          user_id: string
          folder_id: string
          question_text: string
          my_answer: string
          correct_answer: string
          explanation: string
          subject: string
          tags: string[]
          difficulty: 'easy' | 'medium' | 'hard'
          wrong_count: number
          last_reviewed_at: string | null
          images: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id: string
          question_text: string
          my_answer: string
          correct_answer: string
          explanation: string
          subject: string
          tags?: string[]
          difficulty: 'easy' | 'medium' | 'hard'
          wrong_count?: number
          last_reviewed_at?: string | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string
          question_text?: string
          my_answer?: string
          correct_answer?: string
          explanation?: string
          subject?: string
          tags?: string[]
          difficulty?: 'easy' | 'medium' | 'hard'
          wrong_count?: number
          last_reviewed_at?: string | null
          images?: string[]
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
