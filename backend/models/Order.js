const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'client_id',
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  totalValue: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'total_value'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
  quoteId: {
    type: DataTypes.STRING,
    field: 'quote_id'
  },
  createdDate: {
    type: DataTypes.STRING,
    field: 'created_date'
  },
  // Invoice generation fields
  invoiceNumber: {
    type: DataTypes.STRING,
    field: 'invoice_number',
    allowNull: true
  },
  invoiceType: {
    type: DataTypes.STRING,
    field: 'invoice_type',
    defaultValue: 'Tax Invoice'
  },
  invoiceDate: {
    type: DataTypes.STRING,
    field: 'invoice_date',
    allowNull: true
  },
  customerAddress: {
    type: DataTypes.TEXT,
    field: 'customer_address',
    allowNull: true
  },
  customerState: {
    type: DataTypes.STRING,
    field: 'customer_state',
    allowNull: true
  },
  customerGstin: {
    type: DataTypes.STRING,
    field: 'customer_gstin',
    allowNull: true
  },
  reverseCharge: {
    type: DataTypes.STRING,
    field: 'reverse_charge',
    defaultValue: 'N'
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    defaultValue: 0
  },
  cgstAmount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'cgst_amount'
  },
  sgstAmount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'sgst_amount'
  },
  taxTotal: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'tax_total'
  },
  shipping: {
    type: DataTypes.DOUBLE,
    defaultValue: 0
  },
  grandTotal: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
    field: 'grand_total'
  },
  // Custom Seller and Bank Account details per Invoice
  sellerName: {
    type: DataTypes.STRING,
    field: 'seller_name',
    defaultValue: 'Sanna Innovations'
  },
  sellerLogo: {
    type: DataTypes.TEXT,
    field: 'seller_logo',
    allowNull: true
  },
  sellerAddress: {
    type: DataTypes.TEXT,
    field: 'seller_address',
    allowNull: true
  },
  sellerWebsite: {
    type: DataTypes.STRING,
    field: 'seller_website',
    allowNull: true
  },
  sellerGstin: {
    type: DataTypes.STRING,
    field: 'seller_gstin',
    allowNull: true
  },
  bankName: {
    type: DataTypes.STRING,
    field: 'bank_name',
    allowNull: true
  },
  bankAccountName: {
    type: DataTypes.STRING,
    field: 'bank_account_name',
    allowNull: true
  },
  bankAccountType: {
    type: DataTypes.STRING,
    field: 'bank_account_type',
    allowNull: true
  },
  bankAccountNumber: {
    type: DataTypes.STRING,
    field: 'bank_account_number',
    allowNull: true
  },
  bankIfscCode: {
    type: DataTypes.STRING,
    field: 'bank_ifsc_code',
    allowNull: true
  },
  bankBranch: {
    type: DataTypes.STRING,
    field: 'bank_branch',
    allowNull: true
  },
  // Deal & Payment status tracking fields
  dealId: {
    type: DataTypes.STRING,
    field: 'deal_id',
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.STRING,
    field: 'payment_status',
    defaultValue: 'Paid'
  },
  paidAmount: {
    type: DataTypes.DOUBLE,
    field: 'paid_amount',
    defaultValue: 0
  },
  remainingAmount: {
    type: DataTypes.DOUBLE,
    field: 'remaining_amount',
    defaultValue: 0
  },
  pastAdvancePaid: {
    type: DataTypes.DOUBLE,
    field: 'past_advance_paid',
    defaultValue: 0
  },
  pastInstallmentsPaid: {
    type: DataTypes.DOUBLE,
    field: 'past_installments_paid',
    defaultValue: 0
  },
  totalPaidSoFar: {
    type: DataTypes.DOUBLE,
    field: 'total_paid_so_far',
    defaultValue: 0
  },
  projectContractValue: {
    type: DataTypes.DOUBLE,
    field: 'project_contract_value',
    defaultValue: 0
  },
  remainingProjectRevenue: {
    type: DataTypes.DOUBLE,
    field: 'remaining_project_revenue',
    defaultValue: 0
  }
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;

