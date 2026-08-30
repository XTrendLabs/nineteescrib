import { AppError } from "../../../core";
import { storageService } from "../storage/storage.service";
import { expenseRepo, HQ_SHARED_ID } from "./expense.repo";
import type {
  CreateExpenseInput,
  RecordPaymentInput,
  UpdateExpenseInput,
} from "./expense.schema";

/**
 * The client sends a sentinel for "no property"; the column is nullable.
 * Anything that is not a real property id -- the sentinel, "", null -- means an
 * HQ-shared cost.
 */
function normalizePropertyId(value: string | null | undefined) {
  return !value || value === HQ_SHARED_ID ? null : value;
}

/** Optional foreign keys arrive as "" from untouched selects; store NULL. */
function normalizeVendorId(value: string | null | undefined) {
  return value ? value : null;
}

export const expenseService = {
  listByHqOrganization(hqOrganizationId: string) {
    return expenseRepo.listByHqOrganization(hqOrganizationId);
  },

  listByProperty(organizationId: string, hqOrganizationId: string) {
    return expenseRepo.listByProperty(organizationId, hqOrganizationId);
  },

  findById(id: string) {
    return expenseRepo.findById(id);
  },

  findHqOrganizationId(id: string) {
    return expenseRepo.findHqOrganizationId(id);
  },

  findExpenseIdByPayment(paymentId: string) {
    return expenseRepo.findExpenseIdByPayment(paymentId);
  },

  create(
    hqOrganizationId: string,
    createdByUserId: string,
    input: CreateExpenseInput,
  ) {
    const { initialPayment, organizationId, vendorId, ...rest } = input;

    return expenseRepo.create({
      ...rest,
      hqOrganizationId,
      createdByUserId,
      organizationId: normalizePropertyId(organizationId),
      vendorId: normalizeVendorId(vendorId),
      initialPayment: initialPayment
        ? { ...initialPayment, recordedByUserId: createdByUserId }
        : undefined,
    });
  },

  update(id: string, input: UpdateExpenseInput) {
    const { organizationId, vendorId, ...rest } = input;

    return expenseRepo.update(id, {
      ...rest,
      organizationId: normalizePropertyId(organizationId),
      vendorId: normalizeVendorId(vendorId),
    });
  },

  /**
   * Records an installment, refusing one that would take the expense past its
   * total.
   *
   * The dialog caps the amount at the remaining balance, but two people
   * settling the same expense at once would each see the same balance and both
   * be within it -- so the check belongs here, against the ledger as it stands
   * at the moment of writing, not against what the client last saw.
   */
  async recordPayment(
    id: string,
    recordedByUserId: string,
    input: RecordPaymentInput,
  ) {
    const totals = await expenseRepo.totals(id);
    if (!totals) return undefined;

    const remaining = totals.totalAmountPaise - totals.paidPaise;
    if (input.amountPaise > remaining) {
      throw AppError.validation(
        remaining <= 0
          ? "This expense is already fully paid"
          : "Payment exceeds the remaining balance",
      );
    }

    return expenseRepo.addPayment(id, { ...input, recordedByUserId });
  },

  removePayment(paymentId: string) {
    return expenseRepo.removePayment(paymentId);
  },

  /** Stores the file, then records it against the expense. */
  async addReceipt(expenseId: string, uploadedByUserId: string, file: File) {
    const { url } = await storageService.uploadDocument(file, [
      "expenses",
      expenseId,
      "receipts",
    ]);

    return expenseRepo.addReceipt({
      expenseId,
      url,
      fileName: file.name,
      contentType: file.type,
      uploadedByUserId,
    });
  },

  findReceiptById(receiptId: string) {
    return expenseRepo.findReceiptById(receiptId);
  },

  async removeReceipt(receiptId: string) {
    const receipt = await expenseRepo.findReceiptById(receiptId);
    if (!receipt) return undefined;

    await storageService.deleteByUrl(receipt.url);
    return expenseRepo.removeReceipt(receiptId);
  },

  /**
   * Deletes the expense and the receipt files behind it.
   *
   * The rows cascade, but the stored objects do not -- without this they would
   * linger in the bucket with nothing left pointing at them.
   */
  async remove(id: string) {
    const urls = await expenseRepo.listReceiptUrls(id);

    const removed = await expenseRepo.remove(id);
    if (!removed) return undefined;

    await Promise.all(
      urls.map((url) =>
        storageService.deleteByUrl(url).catch((error) => {
          // The expense is already gone; a failed cleanup must not turn a
          // successful delete into an error for the caller.
          console.error("[expense] failed to delete receipt", url, error);
        }),
      ),
    );

    return removed;
  },
};
