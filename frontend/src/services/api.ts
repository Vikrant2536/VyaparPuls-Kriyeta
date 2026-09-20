export interface Customer {
  id: number;
  name: string;
  phone: string;
  balance: number;
  overdue_amount: number;
  due_soon_amount: number;
  status: 'paid' | 'due_soon' | 'overdue' | 'open';
  reliability_score: number;
  reliability_tier: 'High' | 'Medium' | 'At Risk';
  last_txn_date?: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  customer_id: number;
  customer_name?: string;
  type: 'credit_sale' | 'payment';
  amount: number;
  items_note?: string | null;
  credit_days: number;
  txn_date: string;
  due_date?: string | null;
  amount_settled: number;
  remaining_amount: number;
  status: 'paid' | 'due_soon' | 'overdue' | 'open';
  created_at: string;
}

export interface LedgerData {
  customer: Customer;
  running_balance: number;
  timeline: Transaction[];
}

export interface TodayInsight {
  headline: string;
  action_text: string;
  priority_customer_id?: number | null;
  priority_customer_name?: string | null;
  priority_customer_phone?: string | null;
  priority_amount?: number | null;
  wa_link?: string | null;
}

export interface DashboardSummaryData {
  total_receivable: number;
  due_this_week: number;
  overdue_amount: number;
  overdue_customers_count: number;
  active_customers_count: number;
  today_insight: TodayInsight;
}

export interface CashFlowItem {
  date: string;
  day_name: string;
  expected_inflow: number;
  customer_count: number;
  customer_names: string[];
}

export interface CashFlowResponseData {
  days: number;
  total_expected: number;
  items: CashFlowItem[];
  insight: string;
}

export interface ParseResultData {
  customer_name: string;
  customer_phone?: string | null;
  matched_customer_id?: number | null;
  matched_customer_name?: string | null;
  match_score: number;
  amount: number;
  credit_days: number;
  items?: string | null;
  type: 'credit_sale' | 'payment';
  confidence: number;
  error?: string | null;
}

export interface ReminderResponseData {
  customer_id: number;
  customer_name: string;
  phone: string;
  message: string;
  wa_link: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchDashboardSummary(): Promise<DashboardSummaryData> {
  const res = await fetch(`${API_BASE}/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchCashflow(days: number = 7): Promise<CashFlowResponseData> {
  const res = await fetch(`${API_BASE}/insights/cashflow?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch cashflow insights');
  return res.json();
}

export async function fetchCustomers(q?: string): Promise<Customer[]> {
  const url = q ? `${API_BASE}/customers?q=${encodeURIComponent(q)}` : `${API_BASE}/customers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchCustomerLedger(customerId: number): Promise<LedgerData> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/ledger`);
  if (!res.ok) throw new Error(`Failed to fetch ledger for customer #${customerId}`);
  return res.json();
}

export async function parseHinglishEntry(text: string): Promise<ParseResultData> {
  const res = await fetch(`${API_BASE}/transactions/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to parse text');
  return res.json();
}

export async function saveTransaction(data: {
  customer_id?: number | null;
  customer_name: string;
  customer_phone?: string | null;
  type: 'credit_sale' | 'payment';
  amount: number;
  items_note?: string | null;
  credit_days: number;
  txn_date?: string | null;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save transaction' }));
    throw new Error(err.detail || 'Failed to save transaction');
  }
  return res.json();
}

export async function recordPayment(data: {
  customer_id: number;
  amount: number;
  payment_note?: string | null;
  txn_date?: string | null;
}): Promise<Transaction> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to record payment' }));
    throw new Error(err.detail || 'Failed to record payment');
  }
  return res.json();
}

export async function generateReminder(customerId: number, transactionId?: number): Promise<ReminderResponseData> {
  const res = await fetch(`${API_BASE}/reminders/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, transaction_id: transactionId }),
  });
  if (!res.ok) throw new Error('Failed to generate reminder');
  return res.json();
}

export async function updateCustomer(
  customerId: number,
  data: { name?: string; phone?: string }
): Promise<Customer> {
  const res = await fetch(`${API_BASE}/customers/${customerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update customer' }));
    throw new Error(err.detail || 'Failed to update customer');
  }
  return res.json();
}

export async function triggerDatabaseSeed(): Promise<void> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reseed database');
}
