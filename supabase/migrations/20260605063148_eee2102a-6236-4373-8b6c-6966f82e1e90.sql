
CREATE TABLE public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id text not null,
  plan_label text not null,
  duration_months integer not null,
  price_paise bigint not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'active', -- active | scheduled | expired | cancelled
  razorpay_payment_id uuid references public.razorpay_payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions" ON public.subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_subscriptions_user_status ON public.subscriptions(user_id, status);
