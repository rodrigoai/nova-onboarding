-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('SERVICE', 'PRODUCT');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "noteTypes" "NoteType"[],
    "municipalRegistration" TEXT,
    "stateRegistration" TEXT,
    "certificateUrl" TEXT,
    "certificatePassword" TEXT,
    "serviceCnae" TEXT,
    "serviceCode" TEXT,
    "serviceIss" DECIMAL(7,4),
    "serviceIr" DECIMAL(7,4),
    "servicePis" DECIMAL(7,4),
    "serviceCofins" DECIMAL(7,4),
    "serviceCsll" DECIMAL(7,4),
    "serviceXmlUrl" TEXT,
    "servicePdfUrl" TEXT,
    "productCnae" TEXT,
    "productNcm" TEXT,
    "productIr" DECIMAL(7,4),
    "productPis" DECIMAL(7,4),
    "productCofins" DECIMAL(7,4),
    "productIcmsRules" JSONB,
    "productXmlUrl" TEXT,
    "productPdfUrl" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_cnpj_key" ON "Company"("cnpj");
CREATE INDEX "Company_legalName_idx" ON "Company"("legalName");
CREATE INDEX "Company_updatedAt_idx" ON "Company"("updatedAt");
