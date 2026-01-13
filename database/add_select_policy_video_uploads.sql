-- Add SELECT policy for video_uploads table
-- This allows users to select their own video uploads
CREATE POLICY "Users can select their own video uploads"
  ON public.video_uploads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
