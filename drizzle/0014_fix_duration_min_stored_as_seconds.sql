-- Custom SQL migration file, put your code below! --

-- Strength sessions had raw seconds written into duration_min.
-- Any strength session "longer" than 300 minutes (5 h) is actually seconds.
-- Strava/cardio imports always wrote correct minutes and stay untouched.
UPDATE "fit-manager_training_session"
SET "duration_min" = ROUND("duration_min" / 60.0)
WHERE "type" = 'strength'
  AND "duration_min" > 300;
