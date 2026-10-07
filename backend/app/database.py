import logging
from neo4j import GraphDatabase
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    neo4j_uri: str
    neo4j_username: str
    neo4j_password: str
    neo4j_database: str = "neo4j"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-flash-latest"
    
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8", 
        extra="ignore",
        case_sensitive=False  # Allow both UPPER and lower case env vars
    )

settings = Settings()

class Database:
    def __init__(self):
        self.driver = None

    def connect(self):
        try:
            self.driver = GraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_username, settings.neo4j_password)
            )
            self.driver.verify_connectivity()
            logger.info("Successfully connected to Neo4j Aura.")
        except Exception as e:
            logger.error(f"Failed to connect to Neo4j: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed.")

db = Database()

def get_driver():
    return db.driver
