UPDATE transactions
SET card_number = NULL
WHERE card_number IS NOT NULL;
