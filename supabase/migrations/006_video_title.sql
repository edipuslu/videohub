-- VideoHub — give each delivery a title.
--
-- Clients see a list of links; without a title they have no idea which video is
-- which. This is shown in the client portal and on the printed receipt.
--
-- Safe to run more than once.

alter table public.visionhub_video_deliveries
  add column if not exists title text;
