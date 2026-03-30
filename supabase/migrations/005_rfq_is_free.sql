-- Track whether an RFQ was submitted under the free tier.
-- Free RFQs are limited to 5 US suppliers in the pipeline.
-- Paid RFQs get up to 15 suppliers (US + China) with landed cost estimates.

ALTER TABLE public.rfqs
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
