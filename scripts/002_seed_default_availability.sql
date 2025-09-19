-- Insert default availability (9 AM to 5 PM, Monday to Friday) for existing users
-- This is a helper script to set up basic availability for testing

-- Note: This would typically be handled in the application when users first sign up
-- or through an availability setup wizard

INSERT INTO public.availability (user_id, day_of_week, start_time, end_time, is_available)
SELECT 
  id as user_id,
  generate_series(1, 5) as day_of_week, -- Monday to Friday (1-5)
  '09:00:00'::time as start_time,
  '17:00:00'::time as end_time,
  true as is_available
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM public.availability)
ON CONFLICT DO NOTHING;
