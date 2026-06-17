-- =========================================
-- Categories
-- =========================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Voltage ranges
-- =========================================
CREATE TABLE public.voltage_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  min_volts numeric,
  max_volts numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.voltage_ranges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voltage_ranges TO authenticated;
GRANT ALL ON public.voltage_ranges TO service_role;
ALTER TABLE public.voltage_ranges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view voltage ranges" ON public.voltage_ranges FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage voltage ranges" ON public.voltage_ranges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Product images (multiple per product)
-- =========================================
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_images_product_idx ON public.product_images(product_id);
GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- product_categories junction
-- =========================================
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX product_categories_cat_idx ON public.product_categories(category_id);
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product categories" ON public.product_categories FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage product categories" ON public.product_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- product_voltages junction
-- =========================================
CREATE TABLE public.product_voltages (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  voltage_id uuid NOT NULL REFERENCES public.voltage_ranges(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, voltage_id)
);
GRANT SELECT ON public.product_voltages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_voltages TO authenticated;
GRANT ALL ON public.product_voltages TO service_role;
ALTER TABLE public.product_voltages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product voltages" ON public.product_voltages FOR SELECT TO public USING (true);
CREATE POLICY "Admins manage product voltages" ON public.product_voltages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Extend products
-- =========================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'physical' CHECK (product_type IN ('physical','digital_circuit')),
  ADD COLUMN IF NOT EXISTS digital_file_url text,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS compare_at_price_usd numeric,
  ADD COLUMN IF NOT EXISTS weight_grams numeric;

-- Add a payment_method column on orders for offline methods (momo, bank, cash, stripe)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'stripe' CHECK (payment_method IN ('stripe','momo','bank_transfer','cash'));

-- =========================================
-- Seed categories
-- =========================================
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Components','components','Resistors, capacitors, diodes, LEDs and more',10),
  ('Microcontrollers','microcontrollers','Arduino, Raspberry Pi, ESP32 boards',20),
  ('Tools','tools','Soldering irons, multimeters, screwdrivers, microscopes',30),
  ('Power','power','Batteries, power supplies, regulators',40),
  ('Lighting','lighting','Futuristic bulbs, snake LEDs, ceiling lights, wall lamps',50),
  ('Creative DIY','creative-diy','Acrylic ceiling lights, decorative kits, custom builds',60),
  ('Digital Circuits','digital-circuits','Downloadable schematics and PCB designs',70),
  ('Magnets & Mechanical','magnets-mechanical','Magnets, motors, gears, mechanical parts',80),
  ('PCBs','pcbs','Printed circuit boards and prototyping boards',90)
ON CONFLICT (slug) DO NOTHING;

-- =========================================
-- Seed voltage ranges
-- =========================================
INSERT INTO public.voltage_ranges (label, min_volts, max_volts, sort_order) VALUES
  ('3.3V', 3.3, 3.3, 10),
  ('5V', 5, 5, 20),
  ('9V', 9, 9, 30),
  ('12V', 12, 12, 40),
  ('24V', 24, 24, 50),
  ('110-240V AC', 110, 240, 60)
ON CONFLICT (label) DO NOTHING;

-- =========================================
-- Backfill product_categories from products.category text
-- =========================================
INSERT INTO public.product_categories (product_id, category_id)
SELECT p.id, c.id
FROM public.products p
JOIN public.categories c ON lower(c.name) = lower(p.category)
ON CONFLICT DO NOTHING;

-- Backfill primary images from products.image_url
INSERT INTO public.product_images (product_id, url, is_primary, sort_order)
SELECT id, image_url, true, 0
FROM public.products
WHERE image_url IS NOT NULL
ON CONFLICT DO NOTHING;