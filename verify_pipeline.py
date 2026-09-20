import sys
import httpx
import json

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_demo_test():
    print("=== STARTING VYAPARPULSE FULL PIPELINE VERIFICATION ===")
    client = httpx.Client(base_url=BASE_URL)

    # 1. Health check
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("1. Health Check: OK")

    # 2. Reseed database to clean state
    r = client.post("/api/seed")
    assert r.status_code == 200
    print("2. Reseed DB: OK (~40 customers, ~250 txns)")

    # 3. Dashboard Summary & Insights
    r = client.get("/api/dashboard/summary")
    assert r.status_code == 200
    dash = r.json()
    print(f"3. Dashboard Summary:")
    print(f"   - Total Udhaar: {dash['total_receivable']}")
    print(f"   - Due This Week: {dash['due_this_week']}")
    print(f"   - Overdue: {dash['overdue_amount']} from {dash['overdue_customers_count']} customers")
    print(f"   - Insight Action: {dash['today_insight']['action_text']}")
    assert dash['total_receivable'] > 0
    assert dash['today_insight']['priority_customer_name'] is not None

    # 4. Cashflow Forecast (7 & 14 days)
    r7 = client.get("/api/insights/cashflow?days=7")
    assert r7.status_code == 200
    cf7 = r7.json()
    assert len(cf7['items']) == 7
    print(f"4. 7-Day Cashflow Inflow: {cf7['total_expected']} expected ({cf7['insight']})")

    r14 = client.get("/api/insights/cashflow?days=14")
    assert r14.status_code == 200
    assert len(r14.json()['items']) == 14
    print("   14-Day Forecast: OK")

    # 5. Customer Directory Search
    r = client.get("/api/customers?q=Sharma")
    assert r.status_code == 200
    sharma_list = r.json()
    assert len(sharma_list) > 0
    sharma = sharma_list[0]
    sharma_id = sharma['id']
    initial_balance = sharma['balance']
    print(f"5. Customer Directory: Found '{sharma['name']}' (ID: {sharma_id}, Current Udhaar: {initial_balance}, Score: {sharma['reliability_score']})")

    # 6. Parse Hinglish Voice/Text Entry
    demo_sentence = "Sharma ji ne 2400 ka saaman 7 din udhaar pe liya."
    r = client.post("/api/transactions/parse", json={"text": demo_sentence})
    assert r.status_code == 200
    parsed = r.json()
    print(f"6. Hinglish Parser Output:")
    print(f"   - Extracted Customer: {parsed['customer_name']}")
    print(f"   - Matched Name: {parsed['matched_customer_name']} (Score: {parsed['match_score']}%)")
    print(f"   - Amount: {parsed['amount']}")
    print(f"   - Credit Days: {parsed['credit_days']}")
    print(f"   - Type: {parsed['type']}")
    assert parsed['amount'] == 2400.0
    assert parsed['credit_days'] == 7
    assert parsed['type'] == "credit_sale"
    assert parsed['matched_customer_id'] == sharma_id

    # 7. Save Confirmed Transaction (2-Tap Save)
    r = client.post("/api/transactions", json={
        "customer_id": parsed['matched_customer_id'],
        "customer_name": parsed['customer_name'],
        "amount": parsed['amount'],
        "items_note": parsed['items'],
        "credit_days": parsed['credit_days'],
        "type": parsed['type']
    })
    assert r.status_code == 201
    saved_sale = r.json()
    print(f"7. Confirmed Transaction Saved: Txn ID #{saved_sale['id']}, Due: {saved_sale['due_date']}, Status: {saved_sale['status']}")

    # 8. Check Customer Ledger (Balance Updated)
    r = client.get(f"/api/customers/{sharma_id}/ledger")
    assert r.status_code == 200
    ledger_after_sale = r.json()
    new_balance = ledger_after_sale['running_balance']
    print(f"8. Ledger Updated: Balance changed from {initial_balance} -> {new_balance}")
    assert new_balance == initial_balance + 2400.0

    # 9. Generate WhatsApp Reminder
    r = client.post("/api/reminders/generate", json={
        "customer_id": sharma_id,
        "transaction_id": saved_sale['id']
    })
    assert r.status_code == 200
    reminder = r.json()
    print(f"9. WhatsApp Reminder Generated:")
    print(f"   - Phone: {reminder['phone']}")
    print(f"   - wa.me Link: {reminder['wa_link'][:60]}...")
    assert "wa.me" in reminder['wa_link']
    assert "Shree Ganesh Supermarket" in reminder['message']

    # 10. Record Payment (FIFO Allocation)
    r = client.post("/api/payments", json={
        "customer_id": sharma_id,
        "amount": 2400.0,
        "payment_note": "UPI Demo Payment"
    })
    assert r.status_code == 200
    print(f"10. Recorded Payment: 2400.0 via FIFO")

    # 11. Verify Balance Settled
    r = client.get(f"/api/customers/{sharma_id}/ledger")
    ledger_after_pay = r.json()
    assert ledger_after_pay['running_balance'] == initial_balance
    print(f"11. Balance Post-Settlement: {ledger_after_pay['running_balance']} (Restored exactly!)")

    print("\n>>> ALL 11 END-TO-END PIPELINE CHECKS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    run_e2e_demo_test()
