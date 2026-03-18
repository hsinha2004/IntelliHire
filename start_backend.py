#!/usr/bin/env python3
"""
IntelliHire Backend Startup Script
"""

import subprocess
import sys
import os

def main():
    """Start the IntelliHire backend server"""
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")
    
    print("=" * 60)
    print("IntelliHire - Career Intelligence System")
    print("Starting Backend Server...")
    print("=" * 60)
    
    # Change to backend directory
    os.chdir(backend_dir)
    
    # Start the server
    try:
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        print("Goodbye!")

if __name__ == "__main__":
    main()
