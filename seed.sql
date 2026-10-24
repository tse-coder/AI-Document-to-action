-- Synthetic demo data for Project 10. Run after schema.sql.
-- ON CONFLICT DO NOTHING keeps this file safe to run twice.

INSERT INTO documents (id, title, origin, created_at) VALUES
  ('N1', 'Student ID Card Renewal Notice', 'demo', '2026-10-24T06:00:00Z'),
  ('N2', 'Lab Equipment Borrowing Procedure', 'demo', '2026-10-24T06:00:00Z')
ON CONFLICT DO NOTHING;

INSERT INTO paragraphs (id, doc_id, position, text) VALUES
  ('N1-P1', 'N1', 1, 'The Registrar''s Office will renew student ID cards for the 2026/27 academic year.'),
  ('N1-P2', 'N1', 2, 'Each student must submit two documents: a completed renewal form and one recent passport photo.'),
  ('N1-P3', 'N1', 3, 'Both documents must be submitted to Room 12 of the Registrar''s Office by 15 November 2026.'),
  ('N1-P4', 'N1', 4, 'Final-year students are exempt from the passport photo requirement and submit only the form.'),
  ('N1-P5', 'N1', 5, 'The renewal form must be signed by the department head before submission.'),
  ('N2-P1', 'N2', 1, 'The Engineering Lab lends equipment to registered students for coursework projects.'),
  ('N2-P2', 'N2', 2, 'A student who wants to borrow equipment must present a valid student ID card and a signed borrowing form.'),
  ('N2-P3', 'N2', 3, 'Equipment must be returned within 7 days of the borrowing date.'),
  ('N2-P4', 'N2', 4, 'Students who return equipment late must pay a late fee of 20 birr per day.'),
  ('N2-P5', 'N2', 5, 'Postgraduate students may borrow equipment for up to 14 days instead of 7 days.'),
  ('N2-P6', 'N2', 6, 'Damaged equipment must be reported to the lab technician on the day of return.')
ON CONFLICT DO NOTHING;

-- Two existing checklist tasks, both for N1, with no deadline yet.
INSERT INTO checklist_tasks
  (id, doc_id, description, deadline_date, deadline_text, deadline_source, condition, owner, owner_source, status, last_run_id, created_at, updated_at)
VALUES
  ('TSK-0001', 'N1', 'Submit renewal form',     NULL, NULL, 'none', NULL, 'Student', 'document', 'open', NULL, '2026-10-24T06:00:00Z', '2026-10-24T06:00:00Z'),
  ('TSK-0002', 'N1', 'Prepare passport photo',  NULL, NULL, 'none', NULL, 'Student', 'document', 'open', NULL, '2026-10-24T06:00:00Z', '2026-10-24T06:00:00Z')
ON CONFLICT DO NOTHING;

INSERT INTO task_sources (task_id, doc_id, paragraph_id, ord) VALUES
  ('TSK-0001', 'N1', 'N1-P2', 1),
  ('TSK-0002', 'N1', 'N1-P2', 1)
ON CONFLICT DO NOTHING;
