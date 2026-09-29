"""
Neo4j Database Setup Script for InfoMeTrace
Runs schema and seed data initialization
"""
import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI")
NEO4J_USERNAME = os.getenv("NEO4J_USERNAME")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
NEO4J_DATABASE = os.getenv("NEO4J_DATABASE", "neo4j")

def read_cypher_file(filepath):
    """Read Cypher commands from file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Split by semicolon and filter out comments and empty lines
    commands = []
    for line in content.split('\n'):
        line = line.strip()
        if line and not line.startswith('//'):
            commands.append(line)
    return ' '.join(commands)

def run_cypher_commands(driver, commands_text):
    """Execute Cypher commands"""
    # Split into individual statements (each ending with semicolon)
    statements = [cmd.strip() for cmd in commands_text.split(';') if cmd.strip()]
    
    with driver.session(database=NEO4J_DATABASE) as session:
        for i, statement in enumerate(statements, 1):
            try:
                print(f"Executing statement {i}/{len(statements)}...")
                session.run(statement)
                print(f"✓ Statement {i} completed")
            except Exception as e:
                print(f"✗ Error in statement {i}: {e}")
                print(f"Statement: {statement[:100]}...")

def main():
    print("=" * 60)
    print("InfoMeTrace - Neo4j Database Setup")
    print("=" * 60)
    
    # Connect to Neo4j
    print(f"\nConnecting to Neo4j at {NEO4J_URI}...")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
    
    try:
        # Verify connection
        driver.verify_connectivity()
        print("✓ Connected successfully\n")
        
        # Run schema
        print("-" * 60)
        print("Step 1: Creating Schema (Constraints)")
        print("-" * 60)
        schema_path = os.path.join(os.path.dirname(__file__), '..', 'cypher', 'schema.cypher')
        schema_commands = read_cypher_file(schema_path)
        run_cypher_commands(driver, schema_commands)
        
        # Run seed data
        print("\n" + "-" * 60)
        print("Step 2: Loading Seed Data")
        print("-" * 60)
        seed_path = os.path.join(os.path.dirname(__file__), '..', 'cypher', 'seed.cypher')
        seed_commands = read_cypher_file(seed_path)
        run_cypher_commands(driver, seed_commands)
        
        # Verify data
        print("\n" + "-" * 60)
        print("Step 3: Verifying Data")
        print("-" * 60)
        with driver.session(database=NEO4J_DATABASE) as session:
            result = session.run("MATCH (n) RETURN labels(n)[0] AS Label, count(n) AS Count ORDER BY Label")
            print("\nNode counts:")
            for record in result:
                print(f"  {record['Label']}: {record['Count']}")
            
            result = session.run("MATCH ()-[r]->() RETURN type(r) AS Type, count(r) AS Count ORDER BY Type")
            print("\nRelationship counts:")
            for record in result:
                print(f"  {record['Type']}: {record['Count']}")
        
        print("\n" + "=" * 60)
        print("✓ Database setup completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return 1
    finally:
        driver.close()
    
    return 0

if __name__ == "__main__":
    exit(main())
