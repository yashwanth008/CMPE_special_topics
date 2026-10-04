#!/usr/bin/env python3
"""Validate every cordis.patch.yml and package.json in this repo.

The Loader parses these files at startup; a malformed one fails the install
with a diagnostic that is much harder to read than this script's output. The
`!!js` tag is a DSH Loader extension for expressions (used here to read tokens
from the environment), so the parser is taught to keep it as an opaque marker.
"""
import json
import glob
import sys

import yaml


class LoaderWithJs(yaml.SafeLoader):
    pass


LoaderWithJs.add_constructor(
    'tag:yaml.org,2002:js',
    lambda loader, node: {'__js_expr__': loader.construct_scalar(node)},
)

ok = True

print('\ncordis.patch.yml')
for path in sorted(glob.glob('**/cordis.patch.yml', recursive=True)):
    try:
        doc = yaml.load(open(path), Loader=LoaderWithJs)
        assert isinstance(doc, list), 'a patch must be a top-level YAML list'
        rows = [row for entry in doc for row in entry.get('insert', [])]
        assert rows, 'no insert rows found'
        for row in rows:
            assert 'id' in row, f'row missing id: {row}'
            assert 'name' in row, f'row {row.get("id")} missing name'
        ids = [row['id'] for row in rows]
        assert len(ids) == len(set(ids)), 'duplicate row ids'
        print(f'  ok  {path}\n      {len(rows)} row(s): {", ".join(ids)}')
    except Exception as exc:  # noqa: BLE001
        ok = False
        print(f'  FAIL {path}\n      {exc}')

print('\npackage.json')
for path in sorted(glob.glob('**/package.json', recursive=True)):
    try:
        manifest = json.load(open(path))
        assert manifest.get('name', '').startswith('@'), 'name should be scoped'
        assert manifest.get('type') == 'module', 'bundles are ESM'
        bundle = manifest.get('dsh', {}).get('bundle', {})
        assert bundle.get('patch'), 'dsh.bundle.patch is required for an installable bundle'

        client = manifest.get('dsh', {}).get('client')
        if client:
            assert './client' in manifest.get('exports', {}), \
                'a client plugin must export ./client'
            assert client.get('platform') == 'web', 'client.platform should be web'
        print(f'  ok  {path}\n      {manifest["name"]}'
              + ('  (host + client)' if client else '  (host only)'))
    except Exception as exc:  # noqa: BLE001
        ok = False
        print(f'  FAIL {path}\n      {exc}')

print('\n' + ('all manifests and patches valid' if ok else 'VALIDATION FAILED') + '\n')
sys.exit(0 if ok else 1)
