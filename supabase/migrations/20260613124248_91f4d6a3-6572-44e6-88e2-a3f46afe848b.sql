
DROP POLICY IF EXISTS "Anyone can create a ticket" ON public.support_tickets;
CREATE POLICY "Submit ticket as self or anonymous"
ON public.support_tickets FOR INSERT
WITH CHECK (
  (user_id IS NULL AND auth.uid() IS NULL)
  OR (user_id = auth.uid())
);
