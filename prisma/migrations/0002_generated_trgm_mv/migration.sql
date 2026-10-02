CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS students_name_trgm_idx ON students USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS employees_name_trgm_idx ON employees USING gin (name gin_trgm_ops);

-- Materialized view: frequent visitors (monthly 3+ visits)
CREATE MATERIALIZED VIEW IF NOT EXISTS frequent_visitor_mv AS
SELECT
  v.visitor_id AS student_id,
  COUNT(*)::int AS visit_count,
  date_trunc('month', MIN(v.date_time)) AS period_start,
  date_trunc('month', MAX(v.date_time)) AS period_end
FROM visits v
WHERE v.visitor_type = 'STUDENT' AND v.is_deleted = false
  AND v.date_time >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY v.visitor_id
HAVING COUNT(*) >= 3;

CREATE UNIQUE INDEX IF NOT EXISTS frequent_visitor_mv_student_idx ON frequent_visitor_mv (student_id);
