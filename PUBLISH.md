# Publish `aegisure` To PyPI

Do not store a PyPI token in this repository.

## Build

```bash
cd packages/aegisure
python -m pip install --upgrade build twine
rm -rf dist
python -m build
python -m twine check dist/*
```

## Optional TestPyPI Rehearsal

```bash
python -m twine upload --repository testpypi dist/*
```

Use username `__token__` and paste your TestPyPI token in your own terminal.

## Real PyPI Upload

```bash
python -m twine upload dist/*
```

Use username `__token__` and paste your PyPI token in your own terminal.

Current package version prepared in this repo: `0.2.0`.
