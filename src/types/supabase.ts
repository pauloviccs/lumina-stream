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
            channels: {
                Row: {
                    id: string
                    name: string
                    category: string
                    logo_url: string | null
                    image_color: string
                    is_featured: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    category: string
                    logo_url?: string | null
                    image_color: string
                    is_featured?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    category?: string
                    logo_url?: string | null
                    image_color?: string
                    is_featured?: boolean
                    created_at?: string
                }
            }
            stream_sources: {
                Row: {
                    id: string
                    channel_id: string
                    label: string
                    url: string
                    quality: string
                    type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    channel_id: string
                    label: string
                    url: string
                    quality?: string
                    type?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    channel_id?: string
                    label?: string
                    url?: string
                    quality?: string
                    type?: string
                    created_at?: string
                }
            }
        }
    }
}
