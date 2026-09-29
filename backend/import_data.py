from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
database = os.getenv("NEO4J_DATABASE", "neo4j")

print(f"Connecting to Neo4j...")
print(f"URI: {uri}")
print(f"Database: {database}")

driver = GraphDatabase.driver(uri, auth=(username, password))

def run_cypher_file(file_path, description):
    print(f"\n{'='*60}")
    print(f"📄 {description}")
    print(f"{'='*60}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by semicolons but handle multi-line statements
    statements = []
    current = []
    for line in content.split('\n'):
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        current.append(line)
        if line.endswith(';'):
            statements.append(' '.join(current))
            current = []
    
    with driver.session(database=database) as session:
        for i, statement in enumerate(statements, 1):
            statement = statement.strip().rstrip(';')
            if not statement:
                continue
            try:
                result = session.run(statement)
                summary = result.consume()
                print(f"✅ Statement {i}: {statement[:80]}...")
                if summary.counters:
                    print(f"   Nodes: +{summary.counters.nodes_created}, "
                          f"Relationships: +{summary.counters.relationships_created}, "
                          f"Properties: +{summary.counters.properties_set}")
            except Exception as e:
                print(f"❌ Error in statement {i}: {e}")
                print(f"   Statement: {statement[:100]}")

try:
    # 1. Schema
    run_cypher_file('../cypher/schema.cypher', 'Creating Schema & Constraints')
    
    # 2. Seed Data
    run_cypher_file('../cypher/seed.cypher', 'Loading Seed Data')
    
    print(f"\n{'='*60}")
    print("✅ DATA IMPORT COMPLETE!")
    print(f"{'='*60}")
    
    # Verify data
    with driver.session(database=database) as session:
        result = session.run("""
            MATCH (n)
            RETURN labels(n)[0] as label, count(*) as count
            ORDER BY count DESC
        """)
        
        print("\n📊 Database Summary:")
        print("-" * 40)
        for record in result:
            print(f"  {record['label']:15} : {record['count']:>3} nodes")
            
finally:
    driver.close()
    print("\n🔒 Connection closed.")
