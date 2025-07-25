ALTER TABLE common.message_history
ALTER COLUMN data TYPE JSONB USING data::JSONB;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'common'
          AND table_name = 'message_history'
          AND column_name = 'content'
          AND data_type = 'text'
    ) THEN
        ALTER TABLE common.message_history
        ALTER COLUMN content TYPE JSONB
        USING jsonb_build_array(
            jsonb_build_object(
                'logicalType', 'text',
                'data', content
            )
        );
    END IF;
END
$$;