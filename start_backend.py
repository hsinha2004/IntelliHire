#!/usr/bin/env python3
"""
IntelliHire Backend Startup Script
"""

import subprocess
import sys
import os
import signal

PORT = 8001

def free_port(port: int):
    """Kill any process currently holding the given port."""
    try:
        result = subprocess.run(
            ["lsof", "-ti", f":{port}"],
            capture_output=True, text=True
        )
        pids = result.stdout.strip().split()
        for pid in pids:
            if pid:
                os.kill(int(pid), signal.SIGKILL)
                print(f"  Freed port {port} (killed PID {pid})")
    except Exception:
        pass  # Port was already free

def main():
    """Start the IntelliHire backend server"""
    backend_dir = os.path.join(os.path.dirname(__file__), "backend")

    print("=" * 60)
    print("IntelliHire - Career Intelligence System")
    print("Starting Backend Server...")
    print("=" * 60)

    # Auto-free the port before starting (prevents "address already in use")
    free_port(PORT)

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
