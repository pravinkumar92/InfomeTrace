import os
from google import genai
from google.genai import types

# Load from .env
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

print(f"API Key present: {bool(api_key)}")
print(f"API Key (first 20 chars): {api_key[:20] if api_key else 'None'}...")
print(f"Model: {model_name}")

if not api_key:
    print("ERROR: No API key found!")
    exit(1)

try:
    print("\nCreating Gemini client...")
    client = genai.Client(api_key=api_key)
    
    print("Sending test request...")
    response = client.models.generate_content(
        model=model_name,
        contents="Say 'Hello from Gemini!' in one sentence.",
        config=types.GenerateContentConfig(
            temperature=0.2
        )
    )
    
    print("\n✅ SUCCESS!")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"\n❌ ERROR: {type(e).__name__}")
    print(f"Message: {str(e)}")
    import traceback
    traceback.print_exc()
