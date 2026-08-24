const OrderRepository = require('../repositories/OrderRepository');

class OrderService {
  async getOrdersByTenant(tenantId) {
    return OrderRepository.findByTenant(tenantId);
  }

  async createOrder(tenantId, orderData) {
    const { 
      customerName, 
      totalValue, 
      status, 
      quoteId,
      invoiceNumber,
      invoiceType,
      invoiceDate,
      customerAddress,
      customerState,
      customerGstin,
      reverseCharge,
      items,
      subtotal,
      cgstAmount,
      sgstAmount,
      taxTotal,
      shipping,
      grandTotal,
      sellerName,
      sellerLogo,
      sellerAddress,
      sellerWebsite,
      sellerGstin,
      bankName,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      bankBranch,
      dealId,
      paymentStatus,
      paidAmount,
      remainingAmount,
      pastAdvancePaid,
      pastInstallmentsPaid,
      totalPaidSoFar,
      projectContractValue,
      remainingProjectRevenue
    } = orderData;

    const order = await OrderRepository.create({
      id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId: tenantId,
      customerName,
      totalValue: parseFloat(totalValue || grandTotal) || 0,
      status: status || 'Pending',
      quoteId,
      createdDate: new Date().toISOString().split('T')[0],
      invoiceNumber,
      invoiceType,
      invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
      customerAddress,
      customerState,
      customerGstin,
      reverseCharge: reverseCharge || 'N',
      items: items || [],
      subtotal: parseFloat(subtotal) || 0,
      cgstAmount: parseFloat(cgstAmount) || 0,
      sgstAmount: parseFloat(sgstAmount) || 0,
      taxTotal: parseFloat(taxTotal) || 0,
      shipping: parseFloat(shipping) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      sellerName: sellerName || 'Sanna Innovations',
      sellerLogo,
      sellerAddress,
      sellerWebsite,
      sellerGstin,
      bankName,
      bankAccountName,
      bankAccountType,
      bankAccountNumber,
      bankIfscCode,
      bankBranch,
      dealId,
      paymentStatus: paymentStatus || 'Paid',
      paidAmount: parseFloat(paidAmount) || 0,
      remainingAmount: parseFloat(remainingAmount) || 0,
      pastAdvancePaid: parseFloat(pastAdvancePaid) || 0,
      pastInstallmentsPaid: parseFloat(pastInstallmentsPaid) || 0,
      totalPaidSoFar: parseFloat(totalPaidSoFar) || 0,
      projectContractValue: parseFloat(projectContractValue) || 0,
      remainingProjectRevenue: parseFloat(remainingProjectRevenue) || 0
    });

    return order;
  }

  async updateOrder(tenantId, id, orderData) {
    const updatePayload = {};
    const allowedFields = [
      'customerName', 'totalValue', 'status', 'quoteId', 'invoiceNumber',
      'invoiceType', 'invoiceDate', 'customerAddress', 'customerState', 'customerGstin',
      'reverseCharge', 'items', 'subtotal', 'cgstAmount', 'sgstAmount',
      'taxTotal', 'shipping', 'grandTotal', 'sellerName', 'sellerLogo',
      'sellerAddress', 'sellerWebsite', 'sellerGstin', 'bankName', 'bankAccountName',
      'bankAccountType', 'bankAccountNumber', 'bankIfscCode', 'bankBranch',
      'dealId', 'paymentStatus', 'paidAmount', 'remainingAmount', 'pastAdvancePaid',
      'pastInstallmentsPaid', 'totalPaidSoFar', 'projectContractValue', 'remainingProjectRevenue'
    ];

    for (const key of allowedFields) {
      if (orderData[key] !== undefined) {
        updatePayload[key] = orderData[key];
      }
    }

    if (updatePayload.grandTotal !== undefined && updatePayload.totalValue === undefined) {
      updatePayload.totalValue = parseFloat(updatePayload.grandTotal) || 0;
    }

    const updated = await OrderRepository.updateForTenant(tenantId, id, updatePayload);
    if (!updated) {
      throw new Error('Order not found or access denied.');
    }
    return updated;
  }

  async deleteOrder(tenantId, id) {
    const deleted = await OrderRepository.deleteForTenant(tenantId, id);
    if (!deleted) {
      throw new Error('Order not found or access denied.');
    }
    return true;
  }
}

module.exports = new OrderService();


