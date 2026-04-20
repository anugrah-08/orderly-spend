-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'procurement_manager', 'finance_officer', 'employee');
CREATE TYPE public.vendor_status AS ENUM ('Active', 'Inactive', 'Pending');
CREATE TYPE public.pr_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE public.po_status AS ENUM ('Draft', 'Pending', 'Active', 'Completed', 'Cancelled');
CREATE TYPE public.invoice_status AS ENUM ('Pending', 'Paid', 'Overdue', 'Cancelled');
CREATE TYPE public.payment_status AS ENUM ('Scheduled', 'Processing', 'Paid', 'Failed');

-- =========================================================
-- TIMESTAMP TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles public.app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- =========================================================
-- AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- VENDORS
-- =========================================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  gst_number TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  status public.vendor_status NOT NULL DEFAULT 'Pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PRODUCTS
-- =========================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  sku TEXT UNIQUE,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PURCHASE REQUESTS
-- =========================================================
CREATE TABLE public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pr_number TEXT NOT NULL UNIQUE DEFAULT ('PR-' || lpad((floor(random()*900000)+100000)::text, 6, '0')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  department TEXT,
  estimated_cost NUMERIC(12,2) DEFAULT 0,
  justification TEXT,
  status public.pr_status NOT NULL DEFAULT 'Pending',
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PURCHASE ORDERS + ITEMS
-- =========================================================
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE DEFAULT ('PO-' || to_char(now(), 'YYYY') || '-' || lpad((floor(random()*9000)+1000)::text, 4, '0')),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.po_status NOT NULL DEFAULT 'Draft',
  delivery_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.po_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- INVOICES
-- =========================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  status public.invoice_status NOT NULL DEFAULT 'Pending',
  due_date DATE,
  invoice_date DATE DEFAULT CURRENT_DATE,
  file_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- PAYMENTS
-- =========================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number TEXT NOT NULL UNIQUE DEFAULT ('PAY-' || lpad((floor(random()*900000)+100000)::text, 6, '0')),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT,
  status public.payment_status NOT NULL DEFAULT 'Scheduled',
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- vendors
CREATE POLICY "Authenticated view vendors" ON public.vendors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Procurement manage vendors" ON public.vendors
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));

-- products
CREATE POLICY "Authenticated view products" ON public.products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Procurement manage products" ON public.products
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));

-- purchase_requests
CREATE POLICY "Users view own PRs" ON public.purchase_requests
  FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Approvers view all PRs" ON public.purchase_requests
  FOR SELECT USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));
CREATE POLICY "Authenticated create PRs" ON public.purchase_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Approvers update PRs" ON public.purchase_requests
  FOR UPDATE USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));
CREATE POLICY "Owners delete pending PRs" ON public.purchase_requests
  FOR DELETE USING (auth.uid() = requester_id AND status = 'Pending');

-- purchase_orders
CREATE POLICY "Authenticated view POs" ON public.purchase_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Procurement manage POs" ON public.purchase_orders
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));

-- po_items
CREATE POLICY "Authenticated view PO items" ON public.po_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Procurement manage PO items" ON public.po_items
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));

-- invoices
CREATE POLICY "Authenticated view invoices" ON public.invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Finance manage invoices" ON public.invoices
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]));

-- payments
CREATE POLICY "Authenticated view payments" ON public.payments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Finance manage payments" ON public.payments
  FOR ALL USING (public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]));

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('vendor-documents', 'vendor-documents', false),
  ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- avatars (public read, user-scoped write)
CREATE POLICY "Avatars are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- vendor-documents (private, procurement-only)
CREATE POLICY "Procurement read vendor docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'vendor-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));
CREATE POLICY "Procurement write vendor docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'vendor-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));
CREATE POLICY "Procurement update vendor docs" ON storage.objects
  FOR UPDATE USING (bucket_id = 'vendor-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));
CREATE POLICY "Procurement delete vendor docs" ON storage.objects
  FOR DELETE USING (bucket_id = 'vendor-documents' AND public.has_any_role(auth.uid(), ARRAY['admin','procurement_manager']::public.app_role[]));

-- invoices bucket (finance-only)
CREATE POLICY "Finance read invoice files" ON storage.objects
  FOR SELECT USING (bucket_id = 'invoices' AND public.has_any_role(auth.uid(), ARRAY['admin','finance_officer','procurement_manager']::public.app_role[]));
CREATE POLICY "Finance write invoice files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'invoices' AND public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]));
CREATE POLICY "Finance update invoice files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'invoices' AND public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]));
CREATE POLICY "Finance delete invoice files" ON storage.objects
  FOR DELETE USING (bucket_id = 'invoices' AND public.has_any_role(auth.uid(), ARRAY['admin','finance_officer']::public.app_role[]));
