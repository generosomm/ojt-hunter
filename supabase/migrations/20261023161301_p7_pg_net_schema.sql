-- P7: register pg_net in the extensions schema, not public (Supabase advisor 0014). Its functions stay in schema net.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
