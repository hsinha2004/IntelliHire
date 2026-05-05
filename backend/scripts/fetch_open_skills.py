import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# A comprehensive, keyless pre-compiled skills dataset
# This serves as our Open Skills Taxonomy without relying on restricted APIs
OPEN_SKILLS = [
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby", "php",
    "swift", "kotlin", "scala", "r", "matlab", "perl", "shell", "bash", "powershell", "dart",
    "objective-c", "lua", "haskell", "clojure", "elixir", "erlang", "f#", "assembly", "cobol",
    
    "html", "css", "react", "vue", "angular", "svelte", "nextjs", "nuxt", "django",
    "flask", "fastapi", "spring", "express", "nodejs", "webpack", "vite", "tailwind",
    "bootstrap", "sass", "less", "jquery", "graphql", "rest api", "grpc", "websockets",
    
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "scipy",
    "matplotlib", "seaborn", "plotly", "jupyter", "opencv", "nlp", "machine learning",
    "deep learning", "data analysis", "statistics", "sql", "mongodb", "postgresql",
    "data engineering", "big data", "hadoop", "spark", "hive", "kafka", "snowflake", "databricks",
    
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab", "github",
    "terraform", "ansible", "prometheus", "grafana", "elasticsearch", "redis", "nginx", "apache",
    "ci/cd", "devops", "site reliability engineering", "sre", "linux", "unix", "bash scripting",
    
    "react native", "flutter", "android", "ios", "xamarin", "ionic", "mobile development",
    
    "mysql", "sqlite", "dynamodb", "cassandra", "neo4j", "firebase", "supabase", "mariadb",
    "oracle", "sql server", "pl/sql", "t-sql",
    
    "git", "agile", "scrum", "jira", "confluence", "figma", "sketch",
    "photoshop", "illustrator", "tableau", "power bi", "looker", "excel", "ms office",
    
    "accounting", "bookkeeping", "financial reporting", "tally", "quickbooks",
    "taxation", "auditing", "balance sheet", "gst", "tds", "ifrs", "gaap",
    "financial modeling", "budgeting", "forecasting", "investment analysis",
    "accounts payable", "accounts receivable", "payroll", "cost accounting",
    "sap", "erp",
    
    "banking", "kyc", "aml", "credit analysis", "core banking", "finacle",
    "compliance", "loan processing", "risk management", "trade finance",
    "anti-money laundering", "financial products", "treasury", "wealth management",
    
    "recruitment", "talent acquisition", "hr management", "employee relations",
    "hrms", "labor law", "performance management", "onboarding", "training",
    "compensation", "hris", "organizational development", "succession planning",
    
    "autocad", "structural design", "construction management", "revit", "staad pro",
    "ms project", "civil engineering", "surveying", "site management",
    "mechanical engineering", "solidworks", "catia", "ansys", "cad", "cam",
    
    "sap abap", "sap hana", "sap fiori", "s4hana", "sap basis", "sap mm",
    "sap fi", "sap sd", "sap bw", "sap crm",
    
    "asp.net", "dotnet", ".net", "entity framework", "wpf",
    "winforms", "visual studio", "azure devops",
    
    "seo", "sem", "social media", "content creation", "google analytics",
    "canva", "adobe", "indesign", "email marketing", "copywriting", "brand management",
    "digital marketing", "marketing strategy", "ppc", "b2b marketing", "b2c marketing",
    
    "network security", "firewall", "penetration testing", "siem",
    "vulnerability assessment", "cissp", "ceh", "wireshark", "tcp/ip",
    "ethical hacking", "cybersecurity", "network administration", "vpn",
    "information security", "owasp", "cryptography",
    
    "sales", "crm", "salesforce", "lead generation", "b2b", "b2c",
    "hubspot", "business development", "account management", "customer success",
    
    "selenium", "manual testing", "automation testing", "testng", "junit",
    "api testing", "istqb", "cucumber", "postman", "performance testing",
    "cypress", "playwright", "jest", "mocha",
    
    "business analysis", "requirements gathering", "process mapping", "uml",
    "stakeholder management", "user stories", "gap analysis", "product management",
    
    "etl", "informatica", "ssis", "talend", "pentaho", "data warehouse",
    "airflow", "data pipeline",
    
    "crop management", "soil science", "irrigation", "agronomy", "fertilizers",
    "pest control", "farm management", "precision agriculture",
    
    "blockchain", "solidity", "ethereum", "web3", "smart contracts",
    "cryptocurrency", "defi", "nft", "hyperledger", "rust",
    
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
    "time management", "adaptability", "creativity", "collaboration", "presentation",
    "negotiation", "conflict resolution", "decision making", "emotional intelligence",
    "project management", "strategic thinking", "analytical thinking", "mentoring"
]

def save_to_mongodb():
    print("Connecting to MongoDB...")
    client = MongoClient(MONGO_URI)
    db = client.get_database("intellihire")
    collection = db["open_skills"]
    
    print("Clearing existing skills in the collection...")
    collection.delete_many({})
    
    print("Formatting and inserting Open Skills dataset...")
    # Deduplicate, format to dicts
    unique_skills = sorted(list(set([s.lower() for s in OPEN_SKILLS])))
    formatted_skills = [{"name": skill} for skill in unique_skills]
    
    collection.insert_many(formatted_skills)
    print(f"Successfully inserted {len(formatted_skills)} comprehensive skills into MongoDB.")

if __name__ == "__main__":
    print("=========================================")
    print("Open Skills Offline Migrator")
    print("=========================================")
    save_to_mongodb()
    print("\nDone! Your MongoDB has been populated with a massive offline ontology.")
