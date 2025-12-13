-- 運用計画データの確認
SELECT 
    op.id,
    op.vehicle_id,
    op.plan_date,
    op.shift_type,
    v.machine_number,
    v.vehicle_type
FROM operations.operation_plans op
LEFT JOIN master_data.vehicles v ON op.vehicle_id = v.id
ORDER BY op.plan_date DESC
LIMIT 10;

-- 車両データの確認
SELECT id, machine_number, vehicle_type, management_office_id
FROM master_data.vehicles
LIMIT 10;

-- 基地データの確認
SELECT id, base_name, management_office_id
FROM master_data.bases
LIMIT 10;
