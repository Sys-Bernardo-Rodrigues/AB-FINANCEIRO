-- AlterTable (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'family_groups'
    ) THEN
        -- Verificar se a coluna existe antes de alterar
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'family_groups' 
            AND column_name = 'createdBy'
        ) THEN
            ALTER TABLE "family_groups" ALTER COLUMN "createdBy" DROP DEFAULT;
        END IF;
    END IF;
END $$;
