/**
 * ALL INDIA DRIVER APP - SUPABASE DATABASE SCHEMA
 * -------------------------------------------------------------
 * This file provides the production-ready PostgreSQL & PostGIS schemas
 * for geographic (latitude/longitude) query capabilities.
 * You can copy-paste this direct into your Supabase SQL Editor.
 */

export const DATABASE_SCHEMA_SQL = `
-- 1. Enable PostGIS extension for spatial/geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Drivers Profiles table with geospatial point
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  user_role TEXT DEFAULT 'driver' CHECK (user_role IN ('driver', 'owner')),
  experience INT DEFAULT 0,
  vehicle_type TEXT,
  vehicle_category TEXT CHECK (vehicle_category IN ('Car', 'Commercial', 'Heavy Trailer')),
  work_mode TEXT CHECK (work_mode IN ('Part-time', 'Full-time')),
  timing_slots TEXT[], -- array of chosen times: 'Morning', 'Afternoon', etc.
  photo_url TEXT,
  dl_number TEXT,
  vehicle_no TEXT,
  is_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Offline' CHECK (status IN ('Online', 'Offline')),
  location_name TEXT,
  
  -- PostGIS location point (saves longitude & latitude)
  location_coords GEOGRAPHY(Point, 4326),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create spatial geofencing index for lightspeed 5km indexing
CREATE INDEX IF NOT EXISTS profiles_location_coords_idx 
ON public.profiles 
USING GIST (location_coords);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can edit their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 6. Create RPC function for 5km Geospatial calculation
-- This function calculates distance on the Earth spheroid using PostGIS ST_DWithin
CREATE OR REPLACE FUNCTION get_drivers_within_radius(
  owner_lat DOUBLE PRECISION,
  owner_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION DEFAULT 5000.0 -- 5km default
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  experience INT,
  vehicle_type TEXT,
  vehicle_category TEXT,
  work_mode TEXT,
  timing_slots TEXT[],
  photo_url TEXT,
  dl_number TEXT,
  status TEXT,
  location_name TEXT,
  distance_meters DOUBLE PRECISION
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.phone,
    p.experience,
    p.vehicle_type,
    p.vehicle_category,
    p.work_mode,
    p.timing_slots,
    p.photo_url,
    p.dl_number,
    p.status,
    p.location_name,
    -- Calculate precise geodesic distance in meters
    ST_Distance(
      p.location_coords, 
      ST_SetSRID(ST_MakePoint(owner_lng, owner_lat), 4326)::geography
    ) AS distance_meters
  FROM 
    public.profiles p
  WHERE 
    p.user_role = 'driver'
    AND p.status = 'Online'
    AND ST_DWithin(
      p.location_coords, 
      ST_SetSRID(ST_MakePoint(owner_lng, owner_lat), 4326)::geography, 
      radius_meters
    )
  ORDER BY 
    distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to set PostGIS coordinates on latitude/longitude update
-- (This can be easily triggered from client edge updates)
`;

export const SUPABASE_CLIENT_SAMPLE = `
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fetch drivers within a 5km radius using RPC call
 */
export async function fetchNearbyDrivers(lat: number, lng: number) {
  const { data, error } = await supabase.rpc('get_drivers_within_radius', {
    owner_lat: lat,
    owner_lng: lng,
    radius_meters: 5000 // 5km
  });
  
  if (error) {
    console.error('Geospatial RPC Failure:', error);
    return [];
  }
  return data;
}
`;
