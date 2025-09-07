-- Check current team data in database
SELECT 'CURRENT TEAM DATA IN DATABASE:' as status;
SELECT id, name, role, email, phone FROM team_members ORDER BY name;

-- If the above shows wrong team members, run the fix migration:
-- Run: supabase migration apply 20250907123800_fix_team_data.sql

-- Or apply the fix directly here:

-- Clear wrong team data
DELETE FROM comments;
DELETE FROM tasks WHERE assigned_to NOT IN ('Abebaw', 'Tewachew', 'Mandefro', 'Mamaru');
DELETE FROM team_members WHERE name NOT IN ('Abebaw', 'Tewachew', 'Mandefro', 'Mamaru');

-- Insert correct team members
INSERT INTO team_members (
    id, name, role, specializations, email, phone, completion_rate, average_task_time, quality_score
) VALUES 
    ('TM001', 'Abebaw', 'Software Engineer', ARRAY['System Configuration', 'Quality Assurance', 'Documentation'], 'abebaw@company.et', '+251-91-111-1001', 0, 0, 0),
    ('TM002', 'Tewachew', 'Electrical Engineer', ARRAY['Vehicle Inspection', 'GPS Device Installation'], 'tewachew@company.et', '+251-91-111-1002', 0, 0, 0),
    ('TM003', 'Mandefro', 'Mechanical Engineer', ARRAY['Fuel Sensor Installation', 'Fuel Sensor Calibration'], 'mandefro@company.et', '+251-91-111-1003', 0, 0, 0),
    ('TM004', 'Mamaru', 'Mechanic', ARRAY['Fuel Sensor Installation', 'Fuel Sensor Calibration'], 'mamaru@company.et', '+251-91-111-1004', 0, 0, 0)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    specializations = EXCLUDED.specializations,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- Check after fix
SELECT 'FIXED TEAM DATA:' as status;
SELECT id, name, role, email, phone FROM team_members ORDER BY name;
