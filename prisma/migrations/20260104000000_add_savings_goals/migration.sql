-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "period" "GoalPeriod" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;






