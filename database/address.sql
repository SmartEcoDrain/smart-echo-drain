-- Create address_region table
CREATE TABLE IF NOT EXISTS public.address_region (
    id BIGSERIAL PRIMARY KEY,
    psgc_code BIGINT NOT NULL UNIQUE,
    reg_desc VARCHAR(255) NOT NULL,
    reg_code INT NOT NULL UNIQUE
);

-- Create address_province table
CREATE TABLE IF NOT EXISTS public.address_province (
    id BIGSERIAL PRIMARY KEY,
    psgc_code BIGINT NOT NULL UNIQUE,
    prov_desc VARCHAR(255) NOT NULL,
    reg_code INT NOT NULL REFERENCES public.address_region(reg_code),
    prov_code INT NOT NULL UNIQUE
);

-- Create address_citymun table
CREATE TABLE IF NOT EXISTS public.address_citymun (
    id BIGSERIAL PRIMARY KEY,
    psgc_code BIGINT NOT NULL UNIQUE,
    citymun_desc VARCHAR(255) NOT NULL,
    reg_code INT NOT NULL REFERENCES public.address_region(reg_code),
    prov_code INT NOT NULL REFERENCES public.address_province(prov_code),
    citymun_code INT NOT NULL UNIQUE
);

-- Create address_brgy table
CREATE TABLE IF NOT EXISTS public.address_brgy (
    id BIGSERIAL PRIMARY KEY,
    brgy_code BIGINT NOT NULL UNIQUE,
    brgy_desc VARCHAR(255) NOT NULL,
    reg_code INT NOT NULL REFERENCES public.address_region(reg_code),
    prov_code INT NOT NULL REFERENCES public.address_province(prov_code),
    citymun_code INT NOT NULL REFERENCES public.address_citymun(citymun_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_address_region_reg_code ON public.address_region(reg_code);
CREATE INDEX IF NOT EXISTS idx_address_province_reg_code ON public.address_province(reg_code);
CREATE INDEX IF NOT EXISTS idx_address_province_prov_code ON public.address_province(prov_code);
CREATE INDEX IF NOT EXISTS idx_address_citymun_reg_code ON public.address_citymun(reg_code);
CREATE INDEX IF NOT EXISTS idx_address_citymun_prov_code ON public.address_citymun(prov_code);
CREATE INDEX IF NOT EXISTS idx_address_citymun_citymun_code ON public.address_citymun(citymun_code);
CREATE INDEX IF NOT EXISTS idx_address_brgy_reg_code ON public.address_brgy(reg_code);
CREATE INDEX IF NOT EXISTS idx_address_brgy_prov_code ON public.address_brgy(prov_code);
CREATE INDEX IF NOT EXISTS idx_address_brgy_citymun_code ON public.address_brgy(citymun_code);
CREATE INDEX IF NOT EXISTS idx_address_brgy_brgy_code ON public.address_brgy(brgy_code);

-- Create text search indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_address_region_desc_gin ON public.address_region USING gin(to_tsvector('english', reg_desc));
CREATE INDEX IF NOT EXISTS idx_address_province_desc_gin ON public.address_province USING gin(to_tsvector('english', prov_desc));
CREATE INDEX IF NOT EXISTS idx_address_citymun_desc_gin ON public.address_citymun USING gin(to_tsvector('english', citymun_desc));
CREATE INDEX IF NOT EXISTS idx_address_brgy_desc_gin ON public.address_brgy USING gin(to_tsvector('english', brgy_desc));

-- Enable RLS for each table
ALTER TABLE public.address_region ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_province ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_citymun ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.address_brgy ENABLE ROW LEVEL SECURITY;

-- Allow all users to SELECT (read) data from address_region
CREATE POLICY "Allow read for all users"
ON public.address_region
FOR SELECT
USING (true);

-- Allow all users to SELECT (read) data from address_province
CREATE POLICY "Allow read for all users"
ON public.address_province
FOR SELECT
USING (true);

-- Allow all users to SELECT (read) data from address_citymun
CREATE POLICY "Allow read for all users"
ON public.address_citymun
FOR SELECT
USING (true);

-- Allow all users to SELECT (read) data from address_brgy
CREATE POLICY "Allow read for all users"
ON public.address_brgy
FOR SELECT
USING (true);

-- Get address data efficiently based on current selections
create or replace function get_address_dropdown_data (
  target_reg_code TEXT default null,
  target_prov_code TEXT default null,
  target_citymun_code TEXT default null
) RETURNS JSON as $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'regions', (
      SELECT json_agg(
        json_build_object(
          'reg_code', "reg_code"::text,
          'reg_desc', "reg_desc"
        ) ORDER BY "reg_desc"
      )
      FROM address_region
    ),
    'provinces', (
      CASE 
        WHEN target_reg_code IS NOT NULL THEN (
          SELECT json_agg(
            json_build_object(
              'reg_code', "reg_code"::text,
              'prov_code', "prov_code"::text, 
              'prov_desc', "prov_desc"
            ) ORDER BY "prov_desc"
          )
          FROM address_province
          WHERE "reg_code"::text = target_reg_code
        )
        ELSE '[]'::json
      END
    ),
    'cities', (
      CASE 
        WHEN target_prov_code IS NOT NULL THEN (
          SELECT json_agg(
            json_build_object(
              'reg_code', "reg_code"::text,
              'prov_code', "prov_code"::text,
              'citymun_code', "citymun_code"::text,
              'citymun_desc', "citymun_desc"
            ) ORDER BY "citymun_desc"
          )
          FROM address_citymun
          WHERE "prov_code"::text = target_prov_code
        )
        ELSE '[]'::json
      END
    ),
    'barangays', (
      CASE 
        WHEN target_citymun_code IS NOT NULL THEN (
          SELECT json_agg(
            json_build_object(
              'reg_code', "reg_code"::text,
              'prov_code', "prov_code"::text,
              'citymun_code', "citymun_code"::text,
              'brgy_code', "brgy_code"::text,
              'brgy_desc', UPPER("brgy_desc")
            ) ORDER BY "brgy_desc"
          )
          FROM address_brgy
          WHERE "citymun_code"::text = target_citymun_code
        )
        ELSE '[]'::json
      END
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql
set
  search_path = public;

-- Function to get complete address data for a location
create or replace function get_complete_address_data (citymun_code text) RETURNS json LANGUAGE plpgsql
set
  search_path = public as $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'region', json_build_object('reg_code', r."reg_code", 'reg_desc', r."reg_desc"),
    'province', json_build_object('prov_code', p."prov_code", 'prov_desc', p."prov_desc"),
    'cityMunicipality', json_build_object('citymun_code', c."citymun_code", 'citymun_desc', c."citymun_desc"),
    'barangays', (
      SELECT json_agg(json_build_object('brgy_code', b."brgy_code", 'brgy_desc', UPPER(b."brgy_desc")))
      FROM address_brgy b
      WHERE b."citymun_code" = c."citymun_code"
      ORDER BY b."brgy_desc"
    )
  ) INTO result
  FROM address_citymun c
  JOIN address_province p ON c."prov_code" = p."prov_code"
  JOIN address_region r ON p."reg_code" = r."reg_code"
  WHERE c."citymun_code" = citymun_code;
  
  RETURN result;
END;
$$;



