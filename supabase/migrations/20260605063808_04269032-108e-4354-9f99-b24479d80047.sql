
CREATE TABLE public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  razorpay_payment_row_id uuid not null references public.razorpay_payments(id) on delete cascade,
  reason text not null,
  status text not null default 'pending', -- pending | approved | rejected | processed
  admin_note text,
  refunded_amount_paise bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT ON public.refund_requests TO authenticated;
GRANT ALL ON public.refund_requests TO service_role;

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own refund requests" ON public.refund_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own refund requests" ON public.refund_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all refund requests" ON public.refund_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update refund requests" ON public.refund_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_refund_requests_updated_at
  BEFORE UPDATE ON public.refund_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_refund_requests_user ON public.refund_requests(user_id, status);
