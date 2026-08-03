-- VideoHub — allow fractional video durations (e.g. 12.29 seconds).
--
-- Durations were whole seconds, so a 12.29s video had to be rounded. Widening
-- the column to numeric keeps every existing value exactly as it is (12 stays
-- 12) and simply allows decimals from here on.
--
-- Leftover seconds on the payments table widen for the same reason: pooling
-- decimal durations produces a decimal remainder.
--
-- Billing is unchanged: total seconds still divide into whole 15-second blocks
-- with the remainder left over.
--
-- Safe to run more than once.

alter table public.visionhub_video_deliveries
  alter column duration_seconds type numeric using duration_seconds::numeric;

alter table public.visionhub_payments
  alter column leftover_seconds type numeric using leftover_seconds::numeric;
