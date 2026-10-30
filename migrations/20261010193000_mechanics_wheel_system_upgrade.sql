-- ====================================================================
-- ALL INDIA DRIVER APP: MECHANICS & WHEEL SYSTEM UPGRADE (2W to 40+W)
-- Migration: 20261010193000_mechanics_wheel_system_upgrade.sql
-- ====================================================================

-- 1. VEHICLE CATEGORIES CONFIG TABLE (2 to 40+ Wheels)
CREATE TABLE IF NOT EXISTS public.vehicle_categories_config (
  id TEXT PRIMARY KEY,
  family_group TEXT NOT NULL,
  wheel_count TEXT NOT NULL,
  title_hindi TEXT NOT NULL,
  title_english TEXT NOT NULL,
  icon TEXT NOT NULL,
  subtypes JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_axle TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed all 22 wheel configs if not existing
INSERT INTO public.vehicle_categories_config (id, family_group, wheel_count, title_hindi, title_english, icon, subtypes, default_axle)
VALUES
  ('2w_2', '2-Wheeler', '2', '2-पहिया (Two Wheeler)', '2-Wheeler (Motorcycle / Scooter / EV)', '🛵', '["Motorcycle / Bike", "Scooter", "Electric Two-Wheeler (EV)", "Moped", "Delivery Two-Wheeler"]'::jsonb, '1 Axle'),
  ('3w_3', '3-Wheeler', '3', '3-पहिया (Three Wheeler)', '3-Wheeler (Auto / E-Rickshaw / Cargo)', '🛺', '["Passenger Auto-Rickshaw", "E-Rickshaw (Electric)", "Cargo Three-Wheeler / Loader Auto", "CNG Three-Wheeler", "Diesel Loader Three-Wheeler"]'::jsonb, '2 Axles'),
  ('4w_4', '4-Wheeler', '4', '4-पहिया (Four Wheeler / Car / Taxi)', '4-Wheeler (Car / Taxi / Pickup / Van)', '🚗', '["Hatchback / Sedan / SUV / MPV", "Taxi / Commercial Cab", "Jeep / Utility Vehicle", "Pickup / Small Commercial 4-Wheeler", "Electric Car / EV", "Mini Van / Light Passenger Van"]'::jsonb, '2 Axles'),
  ('6w_6', '6-10 Wheeler Commercial', '6', '6 चक्का कमर्शियल (Light Commercial Vehicle)', '6-Wheeler LCV / Medium Truck', '🚚', '["Light Commercial Vehicle (LCV / 6-Wheeler)", "Tipper", "Staff Bus"]'::jsonb, '2 Axles'),
  ('8w_8', '6-10 Wheeler Commercial', '8', '8 चक्का कमर्शियल ट्रक', '8-Wheeler Medium Commercial Truck', '🚚', '["Medium Commercial Truck (8-Wheeler)", "Goods Lorry"]'::jsonb, '3 Axles'),
  ('10w_10', '6-10 Wheeler Commercial', '10', '10 चक्का भारी लॉरी व बस', '10-Wheeler Heavy Goods Lorry / Bus', '🚚', '["Heavy Goods Lorry (10-Wheeler)", "Sleeper Coach Bus", "Tanker"]'::jsonb, '3 Axles'),
  ('12w_12', '12-22 Wheeler Heavy Truck / Trailer', '12', '12 चक्का मल्टी-एक्सल ट्रक', '12-Wheeler Multi-Axle Rigid Truck', '🚛', '["Multi-Axle Rigid Truck (12-Wheeler)", "Heavy Tipper"]'::jsonb, '4 Axles'),
  ('14w_14', '12-22 Wheeler Heavy Truck / Trailer', '14', '14 चक्का ट्रैक्टर-ट्रेलर', '14-Wheeler Tractor-Trailer', '🚛', '["Tractor-Trailer (14-Wheeler)", "Cement Bulker"]'::jsonb, '4 Axles'),
  ('16w_16', '12-22 Wheeler Heavy Truck / Trailer', '16', '16 चक्का ट्रेलर व टैंकर', '16-Wheeler Heavy Trailer / Tanker', '🚛', '["Container Trailer", "Tanker Trailer", "Bulker"]'::jsonb, '5 Axles'),
  ('18w_18', '12-22 Wheeler Heavy Truck / Trailer', '18', '18 चक्का कंटेनर ट्रेलर', '18-Wheeler Container / Flatbed Trailer', '🚛', '["Container Trailer (18-Wheeler)", "Car Carrier"]'::jsonb, '5 Axles'),
  ('20w_20', '12-22 Wheeler Heavy Truck / Trailer', '20', '20 चक्का भारी ट्रेलर', '20-Wheeler Heavy Transport Trailer', '🚛', '["Heavy Multi-Axle Trailer", "Flatbed Trailer"]'::jsonb, '6 Axles'),
  ('22w_22', '12-22 Wheeler Heavy Truck / Trailer', '22', '22 चक्का भारी मल्टी-एक्सल ट्रेलर', '22-Wheeler Heavy Multi-Axle Trailer', '🚛', '["Multi-Axle Trailer (22-Wheeler)", "Bulker Carrier"]'::jsonb, '6 Axles'),
  ('24w_24', '24-40+ Wheeler Heavy Haulage', '24', '24 चक्का हाइड्रोलिक ट्रेलर', '24-Wheeler Hydraulic Axle Trailer', '🚜', '["Hydraulic Axle Modular Trailer", "ODC Transporter"]'::jsonb, '7-8 Axles'),
  ('26w_26', '24-40+ Wheeler Heavy Haulage', '26', '26 चक्का भारी ट्रेलर', '26-Wheeler Heavy Haulage Transporter', '🚜', '["ODC Transporter", "Transformer Carrier"]'::jsonb, '7-8 Axles'),
  ('28w_28', '24-40+ Wheeler Heavy Haulage', '28', '28 चक्का भारी ट्रेलर', '28-Wheeler Heavy Haulage Transporter', '🚜', '["Modular Multi-Axle Transporter"]'::jsonb, '8 Axles'),
  ('30w_30', '24-40+ Wheeler Heavy Haulage', '30', '30 चक्का भारी ट्रेलर', '30-Wheeler Modular Trailer', '🚜', '["Windmill Blade Carrier", "Industrial Equipment Carrier"]'::jsonb, '9-10 Axles'),
  ('32w_32', '24-40+ Wheeler Heavy Haulage', '32', '32 चक्का भारी ट्रेलर', '32-Wheeler Modular Multi-Axle', '🚜', '["Heavy Modular Axles", "Turbine Carrier"]'::jsonb, '9-10 Axles'),
  ('34w_34', '24-40+ Wheeler Heavy Haulage', '34', '34 चक्का भारी ट्रेलर', '34-Wheeler ODC Heavy Haulage', '🚜', '["ODC Heavy Equipment Carrier"]'::jsonb, '10+ Modular Axles'),
  ('36w_36', '24-40+ Wheeler Heavy Haulage', '36', '36 चक्का भारी ट्रेलर', '36-Wheeler ODC Heavy Haulage', '🚜', '["Super Heavy Modular Axles"]'::jsonb, '10+ Modular Axles'),
  ('38w_38', '24-40+ Wheeler Heavy Haulage', '38', '38 चक्का भारी ट्रेलर', '38-Wheeler ODC Heavy Haulage', '🚜', '["Heavy Haulage Special Vehicle"]'::jsonb, '10+ Modular Axles'),
  ('40w_40', '24-40+ Wheeler Heavy Haulage', '40', '40 चक्का भारी ट्रेलर', '40-Wheeler Super Heavy Modular Axle', '🚜', '["Puller + Modular Trailer Combination"]'::jsonb, '10+ Modular Axles'),
  ('40w_plus', '24-40+ Wheeler Heavy Haulage', '40+', '40+ चक्का ओवरसाइज्ड भारी वाहन', '40+ Wheeler Super Heavy Haulage (ODC / Modular)', '🚜', '["Puller + Multi-Axle Modular Combination", "Mining / Super Heavy Special"]'::jsonb, '10+ Modular Axles')
ON CONFLICT (id) DO NOTHING;

-- 2. MECHANIC SKILLS CONFIG TABLE (20 Skills)
CREATE TABLE IF NOT EXISTS public.mechanic_skills_config (
  id TEXT PRIMARY KEY,
  name_hindi TEXT NOT NULL,
  name_english TEXT NOT NULL,
  icon TEXT NOT NULL,
  applicable_families JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed all 20 skills if not existing
INSERT INTO public.mechanic_skills_config (id, name_hindi, name_english, icon, applicable_families)
VALUES
  ('engine_repair', 'इंजन रिपेयर (पेट्रोल / डीजल / CNG / LPG)', 'Engine Repair (Petrol / Diesel / CNG / LPG)', '⚙️', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('ev_powertrain', 'EV मोटर, बैटरी और कंट्रोलर रिपेयर', 'EV Motor, Battery & Controller Repair', '🔋', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial"]'::jsonb),
  ('gearbox_clutch', 'गियरबॉक्स, क्लच और ट्रांसमिशन सर्विस', 'Gearbox, Clutch & Transmission', '🕹️', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('brake_system', 'ब्रेक सिस्टम (ड्रम / डिस्क / हाइड्रोलिक / एयर ब्रेक)', 'Brake System (Drum / Disc / Hydraulic / Air Brake)', '🛑', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('air_compressor_pneumatic', 'एयर कंप्रेसर, न्यूमेटिक पाइप व वाल्व रिपेयर', 'Air Compressor, Pneumatic Lines & Valves', '💨', '["6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('suspension_leaf_spring', 'सस्पेंशन, कमानी (Leaf Spring) व एयर सस्पेंशन', 'Suspension, Leaf Spring, Shock Absorber & Air Suspension', '🧲', '["3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('steering_differential', 'स्टीयरिंग, एक्सल, डिफ्रेंशियल व व्हील हब', 'Steering, Axle, Differential & Wheel Hub', '☸️', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('tyre_service', 'टायर, ट्यूब, पंचर व हैवी टायर अलाइनमेंट', 'Tyre, Tube, Puncture, Wheel Alignment & Heavy Tyre Service', '🔘', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('electrical_battery', 'इलेक्ट्रिकल वायरिंग, अल्टरनेटर, सेल्फ-स्टार्ट व बैटरी', 'Electrical Wiring, Alternator, Self-Start, Battery & Lighting', '⚡', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('ecu_sensor_diagnostics', 'ECU / ECM / OBD स्कैनर व सेंसर डायग्नोस्टिक्स', 'ECU / ECM / OBD / Sensor Diagnostics', '💻', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer"]'::jsonb),
  ('ac_cabin_cooling', 'AC, हीटिंग व केबिन कूलिंग रिपेयर', 'AC, Heating & Cabin Cooling', '❄️', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer"]'::jsonb),
  ('hydraulic_tipper', 'हाइड्रोलिक सिस्टम, जैक, टिपर व ट्रेलर हाइड्रोलिक्स', 'Hydraulic System, Jack, Tipper & Trailer Hydraulics', '🏗️', '["6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('fifth_wheel_coupling', 'फिफ्थ-व्हील कपलिंग, किंगपिन व ट्रेलर कपलिंग', 'Fifth-Wheel Coupling, Kingpin, Drawbar & Trailer Coupling', '🔗', '["12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('welding_chassis', 'वेल्डिंग, चेसिस, बॉडी व स्ट्रक्चरल फैब्रिकेशन', 'Welding, Chassis, Body & Structural Fabrication', '🔥', '["3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('fuel_injection_turbo', 'फ्यूल इंजेक्शन पंप, नोजल, टर्बो व DPF / SCR रिपेयर', 'Fuel Injection, Pump, Injector, Turbo & Exhaust / DPF / SCR', '⛽', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('cooling_radiator', 'कूलिंग सिस्टम, रेडिएटर, होज़ व वाटर पंप', 'Cooling System, Radiator, Hose & Water Pump', '💧', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('periodic_service', 'नियमित सर्विसिंग, इंजन ऑयल, फ़िल्टर व ग्रीसिंग', 'Periodic Servicing, Oil, Filters & Greasing', '🛢️', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('roadside_breakdown', 'इमरजेंसी ऑन-रोड ब्रेकडाउन सहायता (24x7 SOS)', 'Emergency Roadside Breakdown Support', '🚨', '["2-Wheeler", "3-Wheeler", "4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('towing_recovery', 'टोइंग, रिकवरी व क्रेन समन्वय सेवा', 'Recovery, Towing & Crane Coordination', '🚜', '["4-Wheeler", "6-10 Wheeler Commercial", "12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb),
  ('heavy_multi_axle_odc', 'मल्टी-एक्सल व ODC ट्रेलर भारी मरम्मत विशेषज्ञ', 'Heavy Multi-Axle & ODC Trailer Specialist', '🎖️', '["12-22 Wheeler Heavy Truck / Trailer", "24-40+ Wheeler Heavy Haulage"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. MECHANICS TABLE
CREATE TABLE IF NOT EXISTS public.mechanics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  garage_name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  supported_family_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  supported_wheel_counts JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_mode TEXT NOT NULL DEFAULT 'Both Workshop & Roadside',
  service_radius_km INTEGER NOT NULL DEFAULT 30,
  rating NUMERIC(3, 2),
  verified BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT true,
  emergency_24x7 BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MECHANIC SOS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.mechanic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mechanic_id UUID REFERENCES public.mechanics(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_role TEXT NOT NULL CHECK (requester_role IN ('driver', 'owner')),
  vehicle_family TEXT NOT NULL,
  wheel_count TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  location TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_mechanics_online ON public.mechanics(is_online);
CREATE INDEX IF NOT EXISTS idx_mechanics_coords ON public.mechanics(lat, lng);
CREATE INDEX IF NOT EXISTS idx_mechanics_skills ON public.mechanics USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_mechanic_requests_status ON public.mechanic_requests(status);

-- Privacy-Preserving View (Masks phone numbers until contacted)
CREATE OR REPLACE VIEW public.discoverable_mechanics AS
SELECT 
  id,
  name,
  garage_name,
  location,
  lat,
  lng,
  supported_family_groups,
  supported_wheel_counts,
  skills,
  service_mode,
  service_radius_km,
  rating,
  verified,
  is_online,
  emergency_24x7,
  CONCAT(SUBSTRING(phone FROM 1 FOR 5), ' XXXXX') as masked_phone
FROM public.mechanics
WHERE is_online = true;
