---
name: "tailwind-vite-installer"
description: "Install and configure Tailwind CSS in React Vite projects with proper plugin setup to avoid common issues like missing modules and content scanning problems. Use when user needs Tailwind CSS setup in a Vite project."
version: "1.0.0"
---

# Tailwind CSS Vite Installer Skill

## When to Use This Skill
- User wants to install Tailwind CSS in a React/Vite project
- User reports Tailwind CSS not working or only some classes working
- User encounters rollup module errors like `Cannot find module '@rollup/rollup-win32-x64-msvc'`
- User faces Tailwind content scanning issues (some classes work, others don't)
- User needs proper Tailwind configuration for Vite projects

## Procedure
1. **Clean existing installation**: Remove node_modules and package-lock.json if rollup errors exist
2. **Install proper Tailwind plugin**: Use `@tailwindcss/vite` instead of PostCSS approach
3. **Update Vite configuration**: Add Tailwind plugin to vite.config.ts
4. **Update CSS import**: Change from `@tailwind` directives to `@import "tailwindcss"`
5. **Configure content scanning**: Ensure proper file extensions are scanned in tailwind.config.js
6. **Verify dependencies**: Ensure all necessary packages are installed

## Setup Steps
1. **Install required packages**:
   - `npm install -D @tailwindcss/vite tailwindcss autoprefixer`

2. **Update vite.config.ts**:
   - Import `tailwindcss` from `@tailwindcss/vite`
   - Add `tailwindcss()` to plugins array alongside existing plugins

3. **Update src/index.css**:
   - Replace `@tailwind base;`, `@tailwind components;`, `@tailwind utilities;` with `@import "tailwindcss";`

4. **Verify tailwind.config.js**:
   - Ensure content scanning covers all relevant file types: `{js,ts,jsx,tsx}`

5. **Test installation**: Run `npm run dev` to confirm Tailwind is working

## Common Issues and Solutions
- **Rollup module errors**: Clean node_modules and reinstall dependencies
- **Partial Tailwind functionality**: Check content configuration in tailwind.config.js
- **Missing colors/flexbox/spacing classes**: Verify CSS import method and content scanning
- **PostCSS plugin errors**: Switch to `@tailwindcss/vite` plugin instead

## Quality Criteria
- Tailwind CSS should work for all class types (colors, flexbox, padding, text, sizing)
- No rollup or module loading errors
- Development server runs without Tailwind-related errors
- Both static and dynamic Tailwind classes work properly

## Example
**Input**: "How do I install Tailwind CSS in my React Vite project?"

**Output**:
1. Install the packages: `npm install -D @tailwindcss/vite tailwindcss autoprefixer`
2. Update vite.config.ts to include the Tailwind plugin
3. Update src/index.css to use `@import "tailwindcss"`
4. Configure tailwind.config.js with proper content scanning
5. Restart development server to apply changes