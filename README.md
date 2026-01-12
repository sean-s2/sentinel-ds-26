# Sentinel Design System - Color Tokens

A comprehensive color token system for the Sentinel design system, supporting light and dark themes with Figma sync.

## 📁 File Structure

```
├── base-styles.json              # Source of truth - all hex color definitions
├── base-styles.scss              # SCSS version of base styles
├── sentinel-ds-colors-mapped.json    # Theme mappings (Figma sync - DO NOT MODIFY)
├── sentinel-ds-colors-mapped.scss    # SCSS version of theme mappings
├── sentinel-ds-colors-resolved.json  # ✨ Generated - Resolved hex values for developers
├── sentinel-ds-colors.css            # ✨ Generated - CSS custom properties
├── build-design-tokens.py        # Build script to generate resolved files
└── build-design-tokens.js        # Node.js version of build script
```

## 🎨 For Designers (Figma)

**Files to edit:**
- `base-styles.json` - Add/modify color hex values
- `sentinel-ds-colors-mapped.json` - Map colors to theme tokens

These files are synced with Figma. After making changes, run the build script to regenerate developer files.

## 💻 For Developers (Vue.js)

### Quick Start

**Option 1: CSS Custom Properties (Recommended)**

```vue
<template>
  <div class="card">
    <h1 class="title">Hello World</h1>
  </div>
</template>

<style scoped>
@import './sentinel-ds-colors.css';

.card {
  background-color: var(--bg-surface-card);
  border: 1px solid var(--bg-surface-border);
  padding: var(--spacing-4);
}

.title {
  color: var(--text-primary);
}
</style>
```

**Option 2: Import JSON Directly**

```vue
<script setup>
import colors from './sentinel-ds-colors-resolved.json'

const theme = ref('light')
const bgColor = computed(() => colors[theme.value].bg.surface.primary)
</script>

<template>
  <div :style="{ backgroundColor: bgColor }">
    Content
  </div>
</template>
```

### Theme Switching

```vue
<script setup>
const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme.value)
}
</script>

<template>
  <button @click="toggleTheme">
    Toggle Theme
  </button>
</template>
```

### Available CSS Custom Properties

All tokens follow this naming pattern:

```css
/* Backgrounds */
--bg-surface-primary
--bg-surface-secondary
--bg-surface-card
--bg-surface-cell-hover

/* Text */
--text-primary
--text-secondary
--text-tertiary
--text-disabled

/* Actions */
--action-buttons-button-primary
--action-buttons-button-primary-hover
--action-checkbox-checkbox-selected

/* Alerts */
--alerts-info-bg
--alerts-error-bg
--alerts-warning-bg
--alerts-success-bg

/* Forms */
--form-input-input-enabled
--form-dropdown-dropdown-enabled

/* Badges */
--badge-badge-grey
--badge-badge-red
--badge-badge-blue

/* And many more... */
```

## 🔄 Keeping Files Synced

### When to Regenerate

Run the build script whenever you:
- Update `base-styles.json` (change hex colors)
- Update `sentinel-ds-colors-mapped.json` (change theme mappings)
- Pull changes from Figma

### How to Regenerate

**Using Python (recommended):**
```bash
python3 build-design-tokens.py
```

**Using Node.js:**
```bash
node build-design-tokens.js
```

**Output:**
```
🎨 Building design tokens...

✅ Generated: sentinel-ds-colors-resolved.json
✅ Generated: sentinel-ds-colors.css

🎉 Build complete!
```

### Automated Sync (Optional)

Add a pre-commit hook to auto-regenerate files:

```bash
# .git/hooks/pre-commit
#!/bin/bash
python3 build-design-tokens.py
git add sentinel-ds-colors-resolved.json sentinel-ds-colors.css
```

## 📊 Token Structure

### Light Theme Example
```json
{
  "light": {
    "bg": {
      "surface": {
        "primary": "#F8FAFCFF",
        "secondary": "#FCFCFDFF",
        "card": "#FFFFFFFF"
      }
    },
    "text": {
      "primary": "#121926FF",
      "secondary": "#4B5565FF"
    }
  }
}
```

### Dark Theme Example
```json
{
  "dark": {
    "bg": {
      "surface": {
        "primary": "#0D121CFF",
        "secondary": "#121926FF",
        "card": "#364152FF"
      }
    },
    "text": {
      "primary": "#CDD5DFFF",
      "secondary": "#9AA4B2FF"
    }
  }
}
```

## 🚨 Important Notes

### DO NOT EDIT
- ❌ `sentinel-ds-colors-resolved.json` - Auto-generated
- ❌ `sentinel-ds-colors.css` - Auto-generated

### SAFE TO EDIT
- ✅ `base-styles.json` - Source color definitions
- ✅ `sentinel-ds-colors-mapped.json` - Theme mappings (synced with Figma)

### Figma Sync Warning
The `sentinel-ds-colors-mapped.json` file contains variable references (like `$Colors-Base-white`) that are connected to Figma. Modifying the structure or variable names will break the Figma sync.

## 🔗 File Relationships

```
┌─────────────────────┐
│  base-styles.json   │  (Hex color values)
│  Figma Sync ✓       │
└──────────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│ sentinel-ds-colors-mapped    │  │  base-styles.scss    │
│ Figma Sync ✓ (Variables)     │  │  (SCSS version)      │
└───────────────┬──────────────┘  └──────────────────────┘
                │
                ▼
     [build-design-tokens.py]
                │
                ├──────────────────────────┐
                │                          │
                ▼                          ▼
┌─────────────────────────────┐  ┌───────────────────────┐
│ sentinel-ds-colors-resolved │  │ sentinel-ds-colors    │
│ (Resolved hex values)       │  │ (CSS custom props)    │
│ FOR DEVELOPERS ✨           │  │ FOR DEVELOPERS ✨     │
└─────────────────────────────┘  └───────────────────────┘
```

## 🛠️ TypeScript Support (Optional)

For better type safety, create a types file:

```typescript
// types/design-tokens.ts
import colors from '../sentinel-ds-colors-resolved.json'

export type Theme = 'light' | 'dark'
export type ColorTokens = typeof colors.light

// Usage:
const bgColor: string = colors.light.bg.surface.primary
```

## 📝 Version History

- **v1.0.0** - Initial release with light and dark themes
- Auto-generated files include version metadata

## 🤝 Contributing

1. Edit `base-styles.json` or `sentinel-ds-colors-mapped.json`
2. Run `python3 build-design-tokens.py`
3. Commit all changed files
4. Push to GitHub

## 📄 License

Part of the Sentinel Design System.
