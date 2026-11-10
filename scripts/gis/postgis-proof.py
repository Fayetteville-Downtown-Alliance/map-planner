"""Pass only synthetic fixture JSON to an explicitly isolated PostgreSQL test cluster."""
import json
import subprocess
import sys
from pathlib import Path
fixture = json.loads((Path(sys.argv[1]) / 'manifest.json').read_text())
assert fixture['synthetic'] and fixture['schemaVersion'] == 1
subprocess.run(['psql', '-X', '-v', 'ON_ERROR_STOP=1', '-v', 'fixture=' + json.dumps(fixture),
                '-f', str(Path(__file__).with_name('postgis-proof.sql'))], check=True)
