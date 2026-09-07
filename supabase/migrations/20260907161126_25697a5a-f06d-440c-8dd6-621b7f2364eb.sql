DROP POLICY "companies update" ON public.companies;
DROP POLICY "companies delete" ON public.companies;
CREATE POLICY "companies update" ON public.companies FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "companies delete" ON public.companies FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "contacts update" ON public.contacts;
DROP POLICY "contacts delete" ON public.contacts;
CREATE POLICY "contacts update" ON public.contacts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "contacts delete" ON public.contacts FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "apps update" ON public.applications;
DROP POLICY "apps delete" ON public.applications;
CREATE POLICY "apps update" ON public.applications FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "apps delete" ON public.applications FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "ev update" ON public.application_events;
DROP POLICY "ev delete" ON public.application_events;
CREATE POLICY "ev update" ON public.application_events FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "ev delete" ON public.application_events FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "cal update" ON public.calendar_events;
DROP POLICY "cal delete" ON public.calendar_events;
CREATE POLICY "cal update" ON public.calendar_events FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "cal delete" ON public.calendar_events FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "tasks update" ON public.tasks;
DROP POLICY "tasks delete" ON public.tasks;
CREATE POLICY "tasks update" ON public.tasks FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "tasks delete" ON public.tasks FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "notes update" ON public.notes;
DROP POLICY "notes delete" ON public.notes;
CREATE POLICY "notes update" ON public.notes FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "notes delete" ON public.notes FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);

DROP POLICY "docs update" ON public.documents;
DROP POLICY "docs delete" ON public.documents;
CREATE POLICY "docs update" ON public.documents FOR UPDATE TO authenticated USING (user_id = auth.uid() OR is_demo) WITH CHECK (user_id = auth.uid() OR is_demo);
CREATE POLICY "docs delete" ON public.documents FOR DELETE TO authenticated USING (user_id = auth.uid() OR is_demo);