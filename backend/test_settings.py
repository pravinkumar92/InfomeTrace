from app.database import settings

print("NEO4J_URI:", settings.neo4j_uri)
print("NEO4J_USERNAME:", settings.neo4j_username)  
print("NEO4J_DATABASE:", settings.neo4j_database)
print("GEMINI_API_KEY:", settings.gemini_api_key)
print("GEMINI_MODEL:", settings.gemini_model)
print("API Key empty?", not settings.gemini_api_key)
