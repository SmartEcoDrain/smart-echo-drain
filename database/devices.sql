-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uuid UUID NOT NULL REFERENCES public.profiles(uuid) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location JSONB NOT NULL DEFAULT '{}'::jsonb, -- stores AddressLocation as JSON
  online_status BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  device_version VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb, -- stores config map as JSON
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create device_data table
CREATE TABLE IF NOT EXISTS public.device_data (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(uuid) ON DELETE CASCADE,
  
  -- Device data fields
  cpu_temperature REAL,
  cpu_frequency REAL,
  ram_usage REAL,
  storage_usage REAL,
  signal_strength REAL,
  battery_voltage REAL,
  battery_percentage REAL,
  solar_wattage REAL,
  uptime_ms BIGINT,
  battery_status VARCHAR(50),
  is_online BOOLEAN DEFAULT false,
  device_other_data JSONB DEFAULT '{}'::jsonb,
  device_status JSONB DEFAULT '{}'::jsonb,
  
  -- Module data fields
  tof REAL,
  force0 REAL,
  force1 REAL,
  weight REAL,
  turbidity REAL,
  ultrasonic REAL,
  module_other_data JSONB DEFAULT '{}'::jsonb,
  module_status JSONB DEFAULT '{}'::jsonb,
  
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_devices_updated_at 
  BEFORE UPDATE ON public.devices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on both tables
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user owns device
CREATE OR REPLACE FUNCTION public.user_owns_device(user_id uuid, device_uuid uuid)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  owns_device BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM devices 
    WHERE uuid = device_uuid AND owner_uuid = user_id
  ) INTO owns_device;
  
  RETURN owns_device;
END;
$$;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid) 
RETURNS BOOLEAN 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status 
  FROM profiles 
  WHERE uuid = user_id;
  RETURN COALESCE(admin_status, false);
END;
$$;

-- RPC function to get user's devices
CREATE OR REPLACE FUNCTION public.get_user_devices(user_id uuid DEFAULT NULL)
RETURNS TABLE(
  uuid uuid,
  owner_uuid uuid,
  name varchar,
  location jsonb,
  online_status boolean,
  is_active boolean,
  device_version varchar,
  config jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := COALESCE(user_id, auth.uid());
  
  -- Only return devices if user owns them OR user is admin
  RETURN QUERY
  SELECT d.uuid, d.owner_uuid, d.name, d.location, d.online_status, 
         d.is_active, d.device_version, d.config, d.created_at, d.updated_at
  FROM devices d
  WHERE d.owner_uuid = target_user_id
     OR public.is_user_admin(auth.uid()) = true;
END;
$$;

-- RPC function to get device data
CREATE OR REPLACE FUNCTION public.get_device_data(device_uuid uuid, limit_count int DEFAULT 100)
RETURNS TABLE(
  uuid uuid,
  device_id uuid,
  cpu_temperature real,
  cpu_frequency real,
  ram_usage real,
  storage_usage real,
  signal_strength real,
  battery_voltage real,
  battery_percentage real,
  solar_wattage real,
  uptime_ms bigint,
  battery_status varchar,
  is_online boolean,
  device_other_data jsonb,
  device_status jsonb,
  tof real,
  force0 real,
  force1 real,
  weight real,
  turbidity real,
  ultrasonic real,
  module_other_data jsonb,
  module_status jsonb,
  last_updated_at timestamptz,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return data if user owns device OR user is admin
  IF public.user_owns_device(auth.uid(), device_uuid) OR 
     public.is_user_admin(auth.uid()) = true THEN
    
    RETURN QUERY
    SELECT dd.uuid, dd.device_id, dd.cpu_temperature, dd.cpu_frequency, dd.ram_usage,
           dd.storage_usage, dd.signal_strength, dd.battery_voltage, dd.battery_percentage,
           dd.solar_wattage, dd.uptime_ms, dd.battery_status, dd.is_online,
           dd.device_other_data, dd.device_status, dd.tof, dd.force0, dd.force1,
           dd.weight, dd.turbidity, dd.ultrasonic, dd.module_other_data,
           dd.module_status, dd.last_updated_at, dd.created_at
    FROM device_data dd
    WHERE dd.device_id = device_uuid
    ORDER BY dd.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$;

-- DEVICES TABLE POLICIES
-- SELECT: Owner or admin
CREATE POLICY "devices_select_policy" ON public.devices
FOR SELECT TO authenticated
USING (
  owner_uuid = auth.uid()
  OR public.is_user_admin(auth.uid()) = true
);

-- INSERT: Only owner can insert their own devices
CREATE POLICY "devices_insert_policy" ON public.devices
FOR INSERT TO authenticated
WITH CHECK (owner_uuid = auth.uid());

-- UPDATE: Owner or admin
CREATE POLICY "devices_update_policy" ON public.devices
FOR UPDATE TO authenticated
USING (
  owner_uuid = auth.uid()
  OR public.is_user_admin(auth.uid()) = true
);

-- DELETE: Owner or admin
CREATE POLICY "devices_delete_policy" ON public.devices
FOR DELETE TO authenticated
USING (
  owner_uuid = auth.uid()
  OR public.is_user_admin(auth.uid()) = true
);

-- DEVICE_DATA TABLE POLICIES
-- SELECT: Owner of device or admin
CREATE POLICY "device_data_select_policy" ON public.device_data
FOR SELECT TO authenticated
USING (
  public.user_owns_device(auth.uid(), device_id)
  OR public.is_user_admin(auth.uid()) = true
);

-- INSERT: Owner of device or admin (for data collection)
CREATE POLICY "device_data_insert_policy" ON public.device_data
FOR INSERT TO authenticated
WITH CHECK (
  public.user_owns_device(auth.uid(), device_id)
  OR public.is_user_admin(auth.uid()) = true
);

-- UPDATE: Owner of device or admin
CREATE POLICY "device_data_update_policy" ON public.device_data
FOR UPDATE TO authenticated
USING (
  public.user_owns_device(auth.uid(), device_id)
  OR public.is_user_admin(auth.uid()) = true
);

-- DELETE: Owner of device or admin
CREATE POLICY "device_data_delete_policy" ON public.device_data
FOR DELETE TO authenticated
USING (
  public.user_owns_device(auth.uid(), device_id)
  OR public.is_user_admin(auth.uid()) = true
);