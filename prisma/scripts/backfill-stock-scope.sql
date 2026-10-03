-- بعد db push: تحويل الدفعات القديمة إلى مخزون عيادة (CLINIC) حسب عيادة الدواء
UPDATE medication_batches b
SET stock_scope = 'CLINIC',
    clinic_id = m.clinic_id
FROM medications m
WHERE b.medication_id = m.id
  AND b.clinic_id IS NULL
  AND (b.stock_scope IS NULL OR b.stock_scope = 'CLINIC');

-- تعيين المخزن الرئيسي على أول عيادة (عدّل إن لزم)
UPDATE clinics SET is_main_store = false;
UPDATE clinics SET is_main_store = true
WHERE id = (SELECT id FROM clinics WHERE is_active = true ORDER BY created_at ASC LIMIT 1);
