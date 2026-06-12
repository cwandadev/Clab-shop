
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL CHECK (price_usd >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  spec_1 TEXT,
  spec_2 TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active products" ON public.products FOR SELECT USING (active = TRUE OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  subtotal_usd NUMERIC(10,2) NOT NULL,
  shipping_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_usd NUMERIC(10,2) NOT NULL,
  display_currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (TRUE);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price_usd NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT INSERT ON public.order_items TO anon;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS(SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (TRUE);

-- Seed sample products
INSERT INTO public.products (slug, name, description, category, price_usd, stock, spec_1, spec_2) VALUES
('arduino-uno-r4', 'Arduino Uno R4', 'Industry standard microcontroller for prototyping. USB-C, pre-soldered headers.', 'Microcontrollers', 24.50, 42, 'ATmega328P', 'USB-C'),
('raspberry-pi-5-8gb', 'Raspberry Pi 5 (8GB)', 'Single-board computer with quad-core ARM Cortex-A76 CPU.', 'Microcontrollers', 80.00, 12, '8GB RAM', 'Quad-core'),
('resistor-pack-10k', 'Precision Resistor Pack 10kΩ', 'Metal film resistors, low noise. Pack of 50 units.', 'Passives', 4.20, 250, '10KΩ', '±1% Tol'),
('led-rgb-5mm', '5mm RGB Diffused LED', 'Common cathode RGB LED with diffused lens. Pack of 25.', 'Lighting', 6.80, 1240, '5mm', 'Common Cathode'),
('snake-led-strip', 'Luma-Snake Flexible LED 1m', 'Continuous COB illumination, 320 LEDs per meter, zero hotspots.', 'Lighting', 14.50, 88, '5.0V', '320 LED/m'),
('futuristic-bulb-void', 'Void Bulb v1', 'Futuristic filament-style LED bulb. E27 socket, dimmable.', 'Lighting', 18.00, 36, 'E27 / 2200K', 'Dimmable'),
('t12-soldering-station', 'T12 Soldering Station', 'Rapid heat-up digital controller with ESD-safe handle.', 'Tools', 89.00, 18, '75W', '450°C Max'),
('precision-screwdriver-h6', 'H6 Precision Driver Set', '24 S2-steel bits with aluminum handle, magnetic case.', 'Tools', 42.00, 64, '24 bits', 'Magnetic'),
('lipo-battery-2000', 'LiPo Cell 3.7V 2000mAh', 'Single-cell lithium polymer battery with JST connector.', 'Power', 8.90, 412, '3.7V', '2000mAh'),
('power-supply-30v', 'Bench Power Supply 30V 5A', 'Adjustable laboratory DC power supply with digital readout.', 'Power', 119.00, 9, '0-30V', '5A Max'),
('pcb-prototype-board', 'Double-sided Prototype PCB', 'FR4 fiberglass prototype board, 7x9cm, 2.54mm pitch.', 'Passives', 3.20, 530, '7x9cm', 'FR4'),
('neodymium-magnet-pack', 'Neodymium Magnet Pack', 'N52 grade 8mm disc magnets, pack of 20.', 'Components', 7.50, 180, 'N52', '8mm Disc'),
('diode-1n4007', '1N4007 Rectifier Diode Pack', 'General purpose 1A rectifier diodes, pack of 100.', 'Passives', 3.50, 880, '1A', '1000V'),
('capacitor-pack-mixed', 'Electrolytic Capacitor Kit', 'Mixed values 1µF–470µF, 24 values, 240 pieces.', 'Passives', 11.00, 145, '1µF-470µF', '240pcs'),
('digital-microscope', 'USB Digital Microscope 1000x', 'For SMD soldering and PCB inspection. 1000x zoom, HD sensor.', 'Tools', 65.00, 22, '1000x', 'USB-C');
