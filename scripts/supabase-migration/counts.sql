select string_agg(t || '=' || c, ' ' order by t) from (
  select 'users' t, count(*) c from users union all select 'sso_accounts', count(*) from sso_accounts
  union all select 'refresh_tokens', count(*) from refresh_tokens union all select 'communities', count(*) from communities
  union all select 'community_members', count(*) from community_members union all select 'groups', count(*) from groups
  union all select 'group_members', count(*) from group_members union all select 'listings', count(*) from listings
  union all select 'listing_images', count(*) from listing_images union all select 'listing_visibility', count(*) from listing_visibility
  union all select 'listing_bookmarks', count(*) from listing_bookmarks union all select '_prisma_migrations', count(*) from _prisma_migrations) x;
select 'rls ' || count(*) filter (where rowsecurity) || '/' || count(*) from pg_tables where schemaname = 'public';
select 'max listing created: ' || max(created_at)::text || ' | sum ids hash: ' || md5(string_agg(id::text, ',' order by id)) from listings;
