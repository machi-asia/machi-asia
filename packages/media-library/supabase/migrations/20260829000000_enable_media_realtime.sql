-- Publishes the media table to the Realtime publication so authenticated
-- clients (MediaLibraryModal) receive live INSERT/UPDATE events.

alter publication supabase_realtime add table public.media;

notify pgrst, 'reload schema';