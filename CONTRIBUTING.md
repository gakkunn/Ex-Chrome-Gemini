# Contributing

Thank you for your interest in contributing to this Chrome extension!  
This document explains the basic flow for contributing. Keep it simple and feel free to adjust this file for your project.

---

## How to report bugs and request features

- For **bugs**, please open a new Issue and use the **“Bug report”** template.
- For **feature requests or improvements**, please use the **“Feature request”** template.
- Before creating a new Issue, please check if a similar Issue already exists.

When filing an Issue, try to include:

- A clear and concise summary
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Screenshots or console logs, if helpful
- Your environment (OS, Chrome version, extension version)

---

## Development setup

1. **Fork** this repository and **clone** your fork locally:

   ```bash
   git clone https://github.com/your-username/Ex-Chrome-Gemini.git
   cd Ex-Chrome-Gemini
   ```

2. Install dependencies (Node.js 18+ recommended for Vite):

   ```bash
   npm install
   ```

3. Open the project in your editor and make sure you can see the `src/` directory.

> 💡 The project uses Vite + TypeScript. `npm run dev` builds to `dist/` in watch mode for loading as an unpacked extension, and `npm run build` creates a production bundle.

---

## Running the extension locally in Chrome

1. Build the extension:

   ```bash
   npm run dev   # watch build to dist/
   # or
   npm run build # one-time production build
   ```

2. Open the extensions page in Chrome:

   - Enter `chrome://extensions/` in the address bar
   - Toggle **"Developer mode"** on in the top right corner
   - Click **"Load unpacked"**

3. Select the `dist/` folder (from the build output).

4. When you change the code, press **"Update"** (or the refresh icon) on the extensions page to reload and verify the behavior.

---

## Coding style & guidelines

- Follow the existing code style (indentation, naming, file structure, etc.).
- If Linters or Formatters (ESLint, Prettier, etc.) are configured in the project, please run them before committing if possible.
- Aim for small and clear commit messages.

Example:

```bash
git commit -m "Fix: handle null tab in background script"
```

---

## Making changes

1. Create a branch from `main` (or `master`):

   ```bash
   git switch -c feature/update-popup-ui
   ```

2. Make necessary changes under `src/`. Run tests or type checks as needed.

3. Commit with a message explaining your changes.

4. Push to your GitHub repository:

   ```bash
   git push origin feature/update-popup-ui
   ```

---

## How to submit a Pull Request

1. Create a **Pull Request (PR)** on GitHub from your branch to the `main` branch of this repository.
2. In the PR body, fill it out according to the provided **Pull Request Template**:
   - Summary of changes
   - Key changes
   - Related Issues (e.g., `Closes #123`)
   - Details of tests or manual verification performed
3. If you receive review comments, make necessary corrections and push to the same branch. The PR will be updated automatically.

---

## Thank you

Thank you for considering contributing to this OSS Chrome extension!  
Bug reports, suggestions, document fixes, and any small contributions are welcome.

