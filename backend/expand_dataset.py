#!/usr/bin/env python3
"""
Expand InfoMeTrace demo dataset with additional suppliers and batches.
Adds data on top of existing seed.cypher without clearing the database.
"""

import sys
from pathlib import Path
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv(Path(__file__).parent / ".env")

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

def load_cypher_file(filepath: Path) -> list[str]:
    """Load and parse Cypher file into individual statements."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by semicolon, filter out comments and empty lines
    statements = []
    for stmt in content.split(';'):
        # Remove comments
        lines = [line for line in stmt.split('\n') 
                if line.strip() and not line.strip().startswith('//')]
        clean_stmt = '\n'.join(lines).strip()
        if clean_stmt:
            statements.append(clean_stmt)
    
    return statements

def main():
    print("=" * 60)
    print("InfoMeTrace - Dataset Expansion")
    print("=" * 60)
    
    if not all([NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD]):
        print("❌ Error: Missing Neo4j credentials in .env file")
        sys.exit(1)
    
    print(f"Connecting to Neo4j at {NEO4J_URI}...")
    driver = GraphDatabase.driver(
        NEO4J_URI,
        auth=(NEO4J_USERNAME, NEO4J_PASSWORD)
    )
    
    try:
        driver.verify_connectivity()
        print("✓ Connected successfully")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    # Load expansion script
    expansion_file = Path(__file__).parent.parent / "cypher" / "seed_expanded.cypher"
    
    if not expansion_file.exists():
        print(f"❌ Error: {expansion_file} not found")
        sys.exit(1)
    
    print(f"\nLoading expansion data from {expansion_file.name}...")
    statements = load_cypher_file(expansion_file)
    print(f"Found {len(statements)} statements to execute")
    
    print("-" * 60)
    print("Executing expansion statements...")
    print("-" * 60)
    
    with driver.session(database=NEO4J_DATABASE) as session:
        for i, statement in enumerate(statements, 1):
            print(f"Executing statement {i}/{len(statements)}...")
            try:
                session.run(statement)
                print(f"✓ Statement {i} completed")
            except Exception as e:
                print(f"❌ Statement {i} failed: {e}")
                print(f"Statement: {statement[:100]}...")
                # Continue with remaining statements
    
    print("-" * 60)
    print("Verifying expanded data...")
    print("-" * 60)
    
    with driver.session(database=NEO4J_DATABASE) as session:
        # Count nodes by label
        result = session.run("MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY label")
        print("Node counts:")
        total_nodes = 0
        for record in result:
            count = record["count"]
            total_nodes += count
            print(f"  {record['label']}: {count}")
        
        print(f"\nTotal nodes: {total_nodes}")
        
        # Count relationships
        result = session.run("MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY type")
        print("\nRelationship counts:")
        total_rels = 0
        for record in result:
            count = record["count"]
            total_rels += count
            print(f"  {record['type']}: {count}")
        
        print(f"\nTotal relationships: {total_rels}")
        
        # Show paneer batch count for isolation testing
        result = session.run("""
            MATCH (b:Batch)
            WHERE b.ingredient CONTAINS 'Paneer'
            RETURN count(b) AS paneer_batches
        """)
        paneer_count = result.single()["paneer_batches"]
        print(f"\n🧀 Paneer batches available for isolation testing: {paneer_count}")
        
        # Show supplier diversity
        result = session.run("MATCH (s:Supplier) RETURN count(s) AS suppliers")
        supplier_count = result.single()["suppliers"]
        print(f"🏭 Total suppliers: {supplier_count}")
    
    driver.close()
    
    print("=" * 60)
    print("✓ Dataset expansion completed successfully!")
    print("=" * 60)
    print("\nNEXT STEPS:")
    print("1. Test batch isolation with B002 vs B011/B012/B013/B014")
    print("2. Verify multi-supplier independence (S001 vs S004)")
    print("3. Run comprehensive traceability tests")

if __name__ == "__main__":
    main()
