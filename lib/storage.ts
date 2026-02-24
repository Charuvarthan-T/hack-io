import { createClient, SupabaseClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET_NAME;
export class StorageService {
    private supabase: SupabaseClient | null = null;
    private bucket: string;
    constructor() {
        this.bucket = BUCKET_NAME || "submissions";
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
            this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        } else {
            console.warn("StorageService: Missing Supabase environment variables. Uploads will fail.");
        }
    }
    async uploadFile(key: string, body: Buffer | ArrayBuffer | Blob | string, contentType: string): Promise<string> {
        if (!this.supabase) {
            throw new Error("Server configuration error: Missing Supabase credentials. Have you restarted the server?");
        }
        const { data, error } = await this.supabase
            .storage
            .from(this.bucket)
            .upload(key, body, {
                contentType: contentType,
                upsert: true
            });
        if (error) {
            console.error(`StorageService: Error uploading file to ${key}`, error);
            throw new Error(`Supabase upload failed: ${error.message}`);
        }
        return data?.path || key;
    }
    async getSignedUrl(key: string, expiresInSeconds: number = 3600): Promise<string> {
        if (!this.supabase) {
            throw new Error("Server configuration error: Missing Supabase credentials.");
        }
        const { data, error } = await this.supabase
            .storage
            .from(this.bucket)
            .createSignedUrl(key, expiresInSeconds);
        if (error) {
            console.error(`StorageService: Error getting signed URL for ${key}`, error);
            throw new Error(`Supabase signed URL failed: ${error.message}`);
        }
        return data.signedUrl;
    }
}
export const storage = new StorageService();
