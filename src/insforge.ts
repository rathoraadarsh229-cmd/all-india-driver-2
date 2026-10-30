import { createClient, type UserSchema, type InsForgeClient } from '@insforge/sdk';

// InsForge Client Configuration
// Reads from Vite environment variables: VITE_INSFORGE_URL and VITE_INSFORGE_ANON_KEY
// with fallback to the configured InsForge project backend
const insforgeUrl = (import.meta.env.VITE_INSFORGE_URL || 'https://nuf662tj.ap-southeast.insforge.app').trim();
const insforgeAnonKey = (import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_52c8d58e54b50df385582c8aee958c3e').trim();

// Validates whether a real project URL is set (not empty and not the placeholder)
export const isInsForgeConfigured = Boolean(
  insforgeUrl && 
  insforgeUrl !== 'https://your-project-id.insforge.dev' &&
  !insforgeUrl.includes('your-project-id')
);

// Create the official InsForge SDK client instance
export const insforge: InsForgeClient = createClient({
  baseUrl: isInsForgeConfigured ? insforgeUrl : 'https://nuf662tj.ap-southeast.insforge.app',
  anonKey: insforgeAnonKey || undefined,
});

export type { UserSchema };
