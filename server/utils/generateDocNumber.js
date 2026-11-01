// Generates sequential, human-readable document numbers like
// INV-2026-000123 or PO-2026-000045, scoped to the current year.
//
// Usage: generateDocNumber(Sale, 'invoice_number', 'INV', transaction)
const generateDocNumber = async (Model, fieldName, prefix, transaction) => {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  const lastDoc = await Model.findOne({
    where: {
      [fieldName]: { [require('sequelize').Op.like]: `${yearPrefix}%` },
    },
    order: [['id', 'DESC']],
    transaction,
    // Lock the row so two concurrent checkouts can't read the same
    // "last" number and generate a duplicate invoice number.
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });

  let nextSeq = 1;
  if (lastDoc) {
    const lastNumber = lastDoc[fieldName];
    const lastSeq = parseInt(lastNumber.split('-').pop(), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  const paddedSeq = String(nextSeq).padStart(6, '0');
  return `${yearPrefix}${paddedSeq}`;
};

module.exports = { generateDocNumber };