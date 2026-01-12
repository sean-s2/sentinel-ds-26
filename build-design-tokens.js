#!/usr/bin/env node

/**
 * Build Design Tokens
 * 
 * This script reads base-styles.json and sentinel-ds-colors-mapped.json,
 * then generates:
 * 1. sentinel-ds-colors-resolved.json - with all variables resolved to hex values
 * 2. sentinel-ds-colors.css - CSS custom properties for light and dark themes
 * 
 * Usage: node build-design-tokens.js
 */

const fs = require('fs');
const path = require('path');

// File paths
const BASE_STYLES_PATH = path.join(__dirname, 'base-styles.json');
const MAPPED_COLORS_PATH = path.join(__dirname, 'sentinel-ds-colors-mapped.json');
const RESOLVED_OUTPUT_PATH = path.join(__dirname, 'sentinel-ds-colors-resolved.json');
const CSS_OUTPUT_PATH = path.join(__dirname, 'sentinel-ds-colors.css');

console.log('🎨 Building design tokens...\n');

// Read input files
const baseStyles = JSON.parse(fs.readFileSync(BASE_STYLES_PATH, 'utf8'));
const mappedColors = JSON.parse(fs.readFileSync(MAPPED_COLORS_PATH, 'utf8'));

// Create a flat lookup map for all color values
const colorLookup = {};

// Helper function to create lookup key from SCSS variable name
function createLookupKey(scssVar) {
  // Convert $Colors-Base-white to base.white
  // Convert $Colors-Text-text-one to text.text-one
  const cleaned = scssVar.replace(/^\$Colors-/, '').replace(/^\$/, '');
  const parts = cleaned.split('-');
  
  // Handle special cases
  if (cleaned.startsWith('border-')) {
    return cleaned; // Keep as-is for $border-default
  }
  
  return cleaned;
}

// Build lookup from base-styles.json
function buildColorLookup(obj, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      buildColorLookup(value, prefix ? `${prefix}.${key}` : key);
    } else if (typeof value === 'string' && value.startsWith('#')) {
      const lookupKey = prefix ? `${prefix}.${key}` : key;
      colorLookup[lookupKey] = value;
      
      // Also add SCSS-style lookup
      const scssKey = lookupKey.replace(/\./g, '-');
      colorLookup[scssKey] = value;
    }
  }
}

buildColorLookup(baseStyles.colors);

// Special mappings for common patterns
colorLookup['base-white'] = baseStyles.colors.base.white;
colorLookup['base-black'] = baseStyles.colors.base.black;
colorLookup['brand-border'] = baseStyles.colors.brand.border;
colorLookup['brand-ice-200'] = baseStyles.colors.brand['ice-200'];
colorLookup['brand-app-background-smoke-50'] = baseStyles.colors.brand['app-background-smoke-50'];
colorLookup['gray-true-50'] = baseStyles.colors['gray-true']['50'];

// Handle storm colors for border-default
colorLookup['storm-100'] = baseStyles.colors.storm['100'];
colorLookup['storm-200'] = baseStyles.colors.storm['200'];

// Resolve a single value (either hex or variable reference)
function resolveValue(value) {
  // If it's already a hex color, return it
  if (typeof value === 'string' && value.startsWith('#')) {
    return value;
  }
  
  // If it's a variable reference
  if (typeof value === 'string' && value.startsWith('$')) {
    // Remove $ prefix and convert to lookup key
    let cleanKey = value.replace(/^\$/, '');
    
    // Handle $Colors- prefix
    cleanKey = cleanKey.replace(/^Colors-/, '');
    
    // Handle special cases
    if (cleanKey === 'border-default') {
      cleanKey = 'storm-100'; // $border-default maps to $Colors-Storm-100
    }
    
    // Convert to lowercase and handle various formats
    const lookupKey = cleanKey.toLowerCase().replace(/\(|\)/g, '');
    
    // Try various lookup patterns
    const patterns = [
      lookupKey,
      lookupKey.replace(/-/g, '.'),
      cleanKey.toLowerCase(),
      cleanKey.toLowerCase().replace(/-/g, '.'),
    ];
    
    for (const pattern of patterns) {
      if (colorLookup[pattern]) {
        return colorLookup[pattern];
      }
    }
    
    console.warn(`⚠️  Warning: Could not resolve variable: ${value}`);
    return value; // Return original if not found
  }
  
  return value;
}

// Recursively resolve all values in an object
function resolveObject(obj) {
  const resolved = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && !Array.isArray(value)) {
      resolved[key] = resolveObject(value);
    } else {
      resolved[key] = resolveValue(value);
    }
  }
  
  return resolved;
}

// Generate resolved JSON
const resolvedColors = {
  meta: {
    version: '1.0.0',
    description: 'Sentinel design system color mappings with resolved hex values',
    generatedFrom: ['base-styles.json', 'sentinel-ds-colors-mapped.json'],
    generatedAt: new Date().toISOString()
  },
  ...resolveObject(mappedColors)
};

// Write resolved JSON
fs.writeFileSync(RESOLVED_OUTPUT_PATH, JSON.stringify(resolvedColors, null, 2));
console.log('✅ Generated: sentinel-ds-colors-resolved.json');

// Generate CSS custom properties
function generateCSS(theme, themeData, indent = '  ') {
  const lines = [];
  
  function processObject(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const cssKey = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        processObject(value, cssKey);
      } else if (typeof value === 'string') {
        lines.push(`${indent}--${cssKey}: ${value};`);
      }
    }
  }
  
  processObject(themeData);
  return lines;
}

const lightCSS = generateCSS('light', resolvedColors.light);
const darkCSS = generateCSS('dark', resolvedColors.dark);

const cssContent = `/**
 * Sentinel Design System - Color Tokens
 * 
 * Auto-generated from base-styles.json and sentinel-ds-colors-mapped.json
 * Generated at: ${new Date().toISOString()}
 * 
 * Usage in Vue:
 * 
 * <style>
 * @import './sentinel-ds-colors.css';
 * 
 * .card {
 *   background-color: var(--bg-surface-card);
 *   color: var(--text-primary);
 * }
 * </style>
 * 
 * Toggle themes:
 * document.documentElement.setAttribute('data-theme', 'dark');
 */

:root {
  /* Light theme (default) */
${lightCSS.join('\n')}
}

[data-theme="dark"] {
  /* Dark theme */
${darkCSS.join('\n')}
}
`;

fs.writeFileSync(CSS_OUTPUT_PATH, cssContent);
console.log('✅ Generated: sentinel-ds-colors.css');

console.log('\n🎉 Build complete!\n');
console.log('Files generated:');
console.log('  - sentinel-ds-colors-resolved.json (for JavaScript/Vue import)');
console.log('  - sentinel-ds-colors.css (for CSS custom properties)');
console.log('\nSource files (DO NOT MODIFY GENERATED FILES):');
console.log('  - base-styles.json (hex color definitions)');
console.log('  - sentinel-ds-colors-mapped.json (theme mappings)');
