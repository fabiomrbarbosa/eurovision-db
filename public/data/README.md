# public/data/

This directory must contain the fetched Eurovision data for the Search component
to work in the browser at runtime.

## Setup

After running `npm run fetch:data`, copy or symlink:

```bash
# Option A — symlink (changes to src/data/ reflect immediately)
ln -s ../src/data public/data

# Option B — copy (safer, explicit)
cp -r src/data public/data
```

Or add to `package.json`:

```json
"postfetch:data": "rm -rf public/data && cp -r src/data public/data"
```

The Search component fetches `/data/senior/index.json` at runtime.
The Astro pages read from `src/data/` at build time via Node fs.
Both paths must be populated.
