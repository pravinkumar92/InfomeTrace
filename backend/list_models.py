import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key: {api_key[:20]}...")

client = genai.Client(api_key=api_key)

print("\n📋 Available Models:")
print("-" * 50)

try:
    models = client.models.list()
    for model in models:
        print(f"✓ {model.name}")
        if hasattr(model, 'display_name'):
            print(f"  Display: {model.display_name}")
        if hasattr(model, 'supported_generation_methods'):
            print(f"  Methods: {model.supported_generation_methods}")
        print()
except Exception as e:
    print(f"❌ Error: {e}")
