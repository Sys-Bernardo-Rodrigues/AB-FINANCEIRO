-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Criar usuário padrão para categorias existentes
INSERT INTO "users" ("id", "name", "email", "password", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000000', 'Usuário Padrão', 'default@financeiro.com', '$2a$10$dummy', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- AlterTable - Adicionar userId às categorias
ALTER TABLE "categories" ADD COLUMN "userId" TEXT;

-- Atualizar categorias existentes com o usuário padrão
UPDATE "categories" SET "userId" = '00000000-0000-0000-0000-000000000000' WHERE "userId" IS NULL;

-- AlterTable - Tornar userId obrigatório
ALTER TABLE "categories" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable - Adicionar userId às transações
ALTER TABLE "transactions" ADD COLUMN "userId" TEXT;
UPDATE "transactions" SET "userId" = '00000000-0000-0000-0000-000000000000' WHERE "userId" IS NULL;
ALTER TABLE "transactions" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable - Adicionar userId aos parcelamentos
ALTER TABLE "installments" ADD COLUMN "userId" TEXT;
UPDATE "installments" SET "userId" = '00000000-0000-0000-0000-000000000000' WHERE "userId" IS NULL;
ALTER TABLE "installments" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "installments" ADD CONSTRAINT "installments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable - Adicionar userId aos planejamentos
ALTER TABLE "plans" ADD COLUMN "userId" TEXT;
UPDATE "plans" SET "userId" = '00000000-0000-0000-0000-000000000000' WHERE "userId" IS NULL;
ALTER TABLE "plans" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex - Índice único para nome de categoria por usuário
CREATE UNIQUE INDEX "categories_name_userId_key" ON "categories"("name", "userId");

