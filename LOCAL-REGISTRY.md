# Testing with Local npm Registry

This guide explains how to test publishing to a local npm registry (verdaccio) before publishing to the real npm registry.

## Setup (One-time)

1. Install verdaccio globally:
   ```bash
   npm install -g verdaccio
   ```

## Testing a Release

### 1. Start Local Registry

In a separate terminal, start verdaccio:

```bash
verdaccio
```

This will start a local registry at `http://localhost:4873`

Leave this running while you test.

### 2. Configure npm to Use Local Registry

Point npm to the local registry:

```bash
npm set registry http://localhost:4873/
```

### 3. Create Test User

Create a user account on your local registry:

```bash
npm adduser --registry http://localhost:4873
```

Use any credentials (they're only local):
- Username: `test`
- Password: `test`
- Email: `test@test.com`

### 4. Build and Test Package

```bash
npm run build
npm run test
```

### 5. Publish to Local Registry

```bash
npm publish --registry http://localhost:4873
```

Or use the version bump workflow:

```bash
# This will fail at git push (expected), but you can test the publish step
npm version patch --no-git-tag-version
npm publish --registry http://localhost:4873
```

### 6. Test Installation from Local Registry

In another directory or project:

```bash
npm install neamtime-log-parser@latest --registry http://localhost:4873
```

Or update the Obsidian plugin's package.json:

```bash
cd /path/to/obsidian-plugin
npm install neamtime-log-parser@0.6.0 --registry http://localhost:4873
npm run build
```

### 7. Reset to Public npm Registry

When done testing:

```bash
npm set registry https://registry.npmjs.org/
```

Or if you want to be explicit:

```bash
npm config delete registry
```

## Quick Commands

### Start Local Registry (Background)
```bash
verdaccio &
# Note the process ID to kill it later with: kill <PID>
```

### Publish Test (One Command)
```bash
npm run build && npm publish --registry http://localhost:4873
```

### Install from Local Registry
```bash
npm install neamtime-log-parser --registry http://localhost:4873
```

### View Local Registry in Browser
Open http://localhost:4873 in your browser to see published packages.

## Helper Script

Add to package.json:

```json
{
  "scripts": {
    "publish:test": "npm run build && npm publish --registry http://localhost:4873",
    "registry:local": "npm set registry http://localhost:4873/",
    "registry:reset": "npm config delete registry"
  }
}
```

Then you can run:

```bash
npm run registry:local
npm run publish:test
# Test installation...
npm run registry:reset
```

## Troubleshooting

### Can't connect to local registry
- Make sure verdaccio is running: `ps aux | grep verdaccio`
- Check the port: `curl http://localhost:4873`

### Package not found
- Make sure you published: `npm search neamtime-log-parser --registry http://localhost:4873`
- Check verdaccio logs for errors

### 401 Unauthorized
- You need to login: `npm adduser --registry http://localhost:4873`

### Reset everything
```bash
# Stop verdaccio
pkill verdaccio

# Delete local verdaccio storage
rm -rf ~/.local/share/verdaccio

# Reset npm registry
npm config delete registry

# Start fresh
verdaccio
```

## Benefits

- **Safe Testing**: Test the entire publish workflow without risking the real npm registry
- **Quick Iteration**: Publish, test, unpublish, fix, repeat as needed
- **Offline**: Works without internet connection
- **Free**: No cost for unlimited publishes/tests
- **Clean**: No pollution of real npm registry with test versions

## After Testing

Once you're confident everything works:

1. Stop verdaccio: `pkill verdaccio`
2. Reset npm registry: `npm config delete registry`
3. Publish to real npm: `npm run release`
