-- Search copy of the site data (plan Task 7). The files in content/ are the master copy.
create table if not exists items (
  kind text not null,
  slug text not null,
  title text not null,
  body text not null,
  url text not null,
  search tsvector generated always as (to_tsvector('english', title || ' ' || body)) stored,
  primary key (kind, slug)
);
create index if not exists items_search on items using gin (search);
