"""Local Windows setup and two-server launcher. Never prints credentials."""
from pathlib import Path
import os
import secrets
import shutil
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / 'backend'
FRONTEND = ROOT / 'frontend'
PYTHON = ROOT / '.venv' / 'Scripts' / 'python.exe'
URL = 'http://127.0.0.1:5173'


def npm(*args):
    return [os.environ.get('COMSPEC', 'cmd.exe'), '/d', '/c', 'npm.cmd', *args]


def checked(command, cwd=ROOT):
    subprocess.run(command, cwd=cwd, check=True)


def configure():
    # This step runs with the newly installed virtual environment's Python.
    os.chdir(BACKEND)
    sys.path.insert(0, str(BACKEND))
    env = BACKEND / '.env'
    if not env.exists():
        # Exclusive creation prevents overwriting any existing configuration.
        with env.open('x', encoding='utf-8') as file:
            file.write('JWT_SECRET=' + secrets.token_hex(32) + '\n')
            file.write('DATABASE_URL=sqlite:///./autostock.db\n')
            file.write('FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\n')
        print('Created private backend configuration. Keep backend/.env out of Git.')
    from app.config import Settings
    from app.database import Base, make_database
    from app.models import User
    from sqlalchemy import select
    try:
        settings = Settings()
    except Exception:
        raise RuntimeError('Existing configuration is invalid. Check backend/.env locally; do not share its secret.') from None
    engine, factory = make_database(settings.database_url)
    try:
        Base.metadata.create_all(engine)
        with factory() as session:
            existing_admin = session.scalar(select(User.id).where(User.role == 'admin').limit(1))
    finally:
        engine.dispose()
    if existing_admin is not None:
        print('An administrator already exists. Existing accounts, passwords and stock are unchanged.')
        return
    print('\nCreate your local administrator. Choose your own password; it will be hidden.')
    while True:
        email = input('Administrator email: ').strip()
        if not email:
            raise RuntimeError('Admin setup cancelled. Run setup.bat again when ready.')
        result = subprocess.run([str(PYTHON), '-m', 'app.seed', '--admin-email', email], cwd=BACKEND)
        if result.returncode == 0:
            return
        if input('Try creating the administrator again? [y/N]: ').strip().lower() != 'y':
            raise RuntimeError('Administrator was not created. Run setup.bat again.')


def setup():
    if sys.version_info < (3, 12):
        raise RuntimeError('Python 3.12 or newer is required. If .venv already exists, rename that folder to .venv-old, then rerun setup.bat with a supported Python. Do not move or delete backend/.env or your database.')
    if not shutil.which('node') or not shutil.which('npm.cmd'):
        raise RuntimeError('Node.js/npm is missing. Install Node.js 22 from nodejs.org, reopen this folder, and rerun setup.bat.')
    version = subprocess.check_output(['node', '--version'], text=True).strip()
    if int(version.lstrip('v').split('.')[0]) < 22:
        raise RuntimeError('Use Node.js 22 or newer. Current version: ' + version)
    if not PYTHON.exists():
        checked([sys.executable, '-m', 'venv', str(ROOT / '.venv')])
    print('\nInstalling backend dependencies...')
    checked([str(PYTHON), '-m', 'pip', 'install', '-r', str(BACKEND / 'requirements.txt')])
    print('\nInstalling frontend dependencies...')
    checked(npm('ci'), FRONTEND)
    checked([str(PYTHON), str(Path(__file__).resolve()), 'configure'])
    print('\nSetup complete. Double-click runme.bat to open AutoStock.')


def preflight():
    if not PYTHON.exists() or not (FRONTEND / 'node_modules' / 'vite').exists():
        raise RuntimeError('Dependencies are missing. Run setup.bat first.')
    if not shutil.which('node') or not shutil.which('npm.cmd'):
        raise RuntimeError('Node.js/npm is not on PATH. Reopen this window after installing it.')
    if not (BACKEND / '.env').exists():
        raise RuntimeError('Configuration is missing. Run setup.bat first.')
    # Validate without emitting validation errors that can contain secret values.
    code = """
from app.config import Settings
from app.database import make_database
from app.models import User
from sqlalchemy import select
settings = Settings()
engine, factory = make_database(settings.database_url)
try:
    with factory() as session:
        if session.scalar(select(User.id).where(User.role == 'admin').limit(1)) is None:
            raise RuntimeError('Administrator setup is incomplete')
finally:
    engine.dispose()
"""
    result = subprocess.run([str(PYTHON), '-c', code], cwd=BACKEND, capture_output=True)
    if result.returncode:
        raise RuntimeError('Backend setup is incomplete or invalid. Run setup.bat to finish admin creation, or check backend/.env locally.')
    for port in (8000, 5173):
        with socket.socket() as sock:
            try:
                # Exclusive bind detects an already-running server on Windows.
                sock.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                sock.bind(('127.0.0.1', port))
            except OSError:
                raise RuntimeError(f'Port {port} is already in use. Stop your previous AutoStock server windows with Ctrl+C, then try again.') from None


def serve(kind):
    try:
        if kind == 'backend':
            result = subprocess.run([str(PYTHON), '-m', 'uvicorn', 'app.main:create_app', '--factory', '--host', '127.0.0.1', '--port', '8000'], cwd=BACKEND)
        else:
            result = subprocess.run(npm('run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'), cwd=FRONTEND)
        print(f'\n{kind.title()} stopped (exit code {result.returncode}).')
    except KeyboardInterrupt:
        print('\nServer stopped.')
    except Exception as error:
        print('Server could not start:', error)
    input('Press Enter to close this server window...')


def run():
    preflight()
    children = []
    for kind in ('backend', 'frontend'):
        children.append(subprocess.Popen([str(PYTHON), str(Path(__file__).resolve()), 'serve', kind], cwd=ROOT, creationflags=subprocess.CREATE_NEW_CONSOLE))
    print('Starting backend and frontend in separate windows. Keep BOTH windows open.')
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    pending = {'http://127.0.0.1:8000/openapi.json', URL}
    deadline = time.monotonic() + 60
    while pending and time.monotonic() < deadline:
        for address in list(pending):
            try:
                with opener.open(address, timeout=2) as response:
                    if response.status == 200:
                        pending.remove(address)
            except (OSError, urllib.error.URLError):
                pass
        if pending:
            time.sleep(0.5)
    if pending:
        raise RuntimeError('Servers were not ready within 60 seconds. Read the two server windows for errors; stop them before retrying.')
    webbrowser.open(URL)
    print('AutoStock is ready at ' + URL)
    print('Log in with the administrator credentials you created in setup.')
    print('To stop the app, press Ctrl+C in BOTH server windows.')


def main():
    if os.name != 'nt':
        raise RuntimeError('These launchers are for Windows.')
    action = sys.argv[1] if len(sys.argv) > 1 else ''
    if action == 'setup':
        setup()
    elif action == 'configure':
        configure()
    elif action == 'run':
        run()
    elif action == 'serve' and len(sys.argv) == 3 and sys.argv[2] in ('backend', 'frontend'):
        serve(sys.argv[2])
    else:
        raise RuntimeError('Open setup.bat or runme.bat.')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\nCancelled. Existing data was not reset.')
        sys.exit(1)
    except Exception as error:
        print('\nERROR:', error)
        sys.exit(1)
