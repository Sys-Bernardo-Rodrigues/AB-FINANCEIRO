-- DropIndex
-- Remove o índice único antigo de categories.name (agora temos categories_name_userId_key)
DROP INDEX IF EXISTS "categories_name_key";
