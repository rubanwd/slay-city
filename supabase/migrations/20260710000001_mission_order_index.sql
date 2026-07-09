-- SLAY CITY — mission ordering within a location
--
-- Locations can now have more than one mission. `order_index` lets the admin
-- control the sequence a child plays them in at a given location (the map
-- picks "the next uncompleted mission in order_index order" per location).

alter table public.missions add column order_index integer not null default 0;
