import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "VyaparPulse — Smart Supermarket Ledger"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./vyaparpulse.db")
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "gemini")  # gemini, claude, rule_only
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    STORE_NAME: str = os.getenv("STORE_NAME", "Shree Ganesh Supermarket")
    STORE_PHONE: str = os.getenv("STORE_PHONE", "+91 98765 43210")
    STORE_UPI_ID: str = os.getenv("STORE_UPI_ID", "shreeganesh@upi")

settings = Settings()
