"""
Load Quantity Tracking & Waste Recovery Schema
"""
from app.database import db

db.connect()

print("=" * 60)
print("Loading Quantity Tracking Schema")
print("=" * 60)

# Read schema file
with open('../cypher/quantity_schema.cypher', 'r', encoding='utf-8') as f:
    schema_content = f.read()

# Split into statements
statements = [s.strip() for s in schema_content.split(';') if s.strip() and not s.strip().startswith('//')]

print(f"\nExecuting {len(statements)} statements...\n")

for idx, statement in enumerate(statements, 1):
    # Skip empty or comment-only statements
    if not statement or statement.startswith('//'):
        continue
    
    try:
        print(f"{idx}. Executing statement...")
        db.driver.execute_query(statement)
        print(f"   ✓ Success")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        print(f"   Statement: {statement[:100]}...")

print("\n" + "=" * 60)
print("Schema loaded successfully!")
print("=" * 60)

# Verify
verify_query = """
MATCH (inv:Inventory)
RETURN count(inv) as inventory_count
"""
result = db.driver.execute_query(verify_query)
for record in result.records:
    print(f"\nInventory nodes created: {record['inventory_count']}")

verify_query2 = """
MATCH (p:RecoveryPartner)
RETURN count(p) as partner_count
"""
result = db.driver.execute_query(verify_query2)
for record in result.records:
    print(f"Recovery partners created: {record['partner_count']}")

db.close()
