CREATE TABLE public.razorpay_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  receipt TEXT,
  notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_razorpay_payments_user ON public.razorpay_payments(user_id);
CREATE INDEX idx_razorpay_payments_order ON public.razorpay_payments(razorpay_order_id);

GRANT SELECT, INSERT ON public.razorpay_payments TO authenticated;
GRANT ALL ON public.razorpay_payments TO service_role;

ALTER TABLE public.razorpay_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own razorpay payments"
ON public.razorpay_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all razorpay payments"
ON public.razorpay_payments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own razorpay payments"
ON public.razorpay_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_razorpay_payments_updated_at
BEFORE UPDATE ON public.razorpay_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();