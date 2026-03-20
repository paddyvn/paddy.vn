
-- Fix delivered orders with wrong financial_status
UPDATE orders SET financial_status = 'paid' 
WHERE status = 'delivered' AND (financial_status = 'pending' OR financial_status IS NULL);

-- Fix shipped orders with wrong financial_status
UPDATE orders SET financial_status = 'paid' 
WHERE status = 'shipped' AND (financial_status = 'pending' OR financial_status IS NULL);

-- Fix confirmed orders with wrong financial_status
UPDATE orders SET financial_status = 'paid' 
WHERE status = 'confirmed' AND (financial_status = 'pending' OR financial_status IS NULL);

-- Fix cancelled orders with wrong financial_status
UPDATE orders SET financial_status = 'voided' 
WHERE status = 'cancelled' AND (financial_status = 'pending' OR financial_status IS NULL);
