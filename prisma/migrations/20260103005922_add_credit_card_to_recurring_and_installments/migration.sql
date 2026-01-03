-- AlterTable
ALTER TABLE "installments" ADD COLUMN     "creditCardId" TEXT;

-- AlterTable
ALTER TABLE "recurring_transactions" ADD COLUMN     "creditCardId" TEXT;

-- AddForeignKey
ALTER TABLE "installments" ADD CONSTRAINT "installments_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "credit_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
