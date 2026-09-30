-- Optional design and pricing answers on the beta feedback form. Prices are
-- Van Westendorp price-sensitivity answers in pounds per month. All columns are
-- nullable so earlier submissions and shorter answers remain valid.
alter table public.beta_feedback
  add column design_rating integer check (design_rating between 1 and 5),
  add column design_note text check (char_length(design_note) <= 500),
  add column payer text check (payer in ('me', 'parent', 'school', 'nobody', 'unsure')),
  add column price_model text check (price_model in ('monthly', 'season-pass', 'free-only', 'unsure')),
  add column price_too_cheap numeric(6, 2) check (price_too_cheap between 0 and 100),
  add column price_bargain numeric(6, 2) check (price_bargain between 0 and 100),
  add column price_expensive numeric(6, 2) check (price_expensive between 0 and 100),
  add column price_too_expensive numeric(6, 2) check (price_too_expensive between 0 and 100);
