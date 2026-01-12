#!/usr/bin/env python3

"""
Build Design Tokens

This script reads base-styles.json and sentinel-ds-colors-mapped.json,
then generates:
1. sentinel-ds-colors-resolved.json - with all variables resolved to hex values
2. sentinel-ds-colors.css - CSS custom properties for light and dark themes

Usage: python3 build-design-tokens.py
"""

import json
import re
from datetime import datetime
from pathlib import Path

print('🎨 Building design tokens...\n')

# File paths
BASE_DIR = Path(__file__).parent
BASE_STYLES_PATH = BASE_DIR / 'base-styles.json'
MAPPED_COLORS_PATH = BASE_DIR / 'sentinel-ds-colors-mapped.json'
RESOLVED_OUTPUT_PATH = BASE_DIR / 'sentinel-ds-colors-resolved.json'
CSS_OUTPUT_PATH = BASE_DIR / 'sentinel-ds-colors.css'

# Read input files
with open(BASE_STYLES_PATH, 'r') as f:
    base_styles = json.load(f)

with open(MAPPED_COLORS_PATH, 'r') as f:
    mapped_colors = json.load(f)

# Create a flat lookup map for all color values
color_lookup = {}

def build_color_lookup(obj, prefix=''):
    """Recursively build a lookup dictionary from base styles"""
    for key, value in obj.items():
        if isinstance(value, dict):
            new_prefix = f"{prefix}.{key}" if prefix else key
            build_color_lookup(value, new_prefix)
        elif isinstance(value, str) and value.startswith('#'):
            lookup_key = f"{prefix}.{key}" if prefix else key
            color_lookup[lookup_key] = value
            
            # Also add with dash separators
            dash_key = lookup_key.replace('.', '-')
            color_lookup[dash_key] = value
            
            # Add lowercase version
            color_lookup[dash_key.lower()] = value

# Build lookup from base-styles
build_color_lookup(base_styles.get('colors', {}))

# Add special mappings
if 'base' in base_styles.get('colors', {}):
    color_lookup['base-white'] = base_styles['colors']['base']['white']
    color_lookup['base-black'] = base_styles['colors']['base']['black']

if 'brand' in base_styles.get('colors', {}):
    brand = base_styles['colors']['brand']
    if 'border' in brand:
        color_lookup['brand-border'] = brand['border']
    if 'ice-200' in brand:
        color_lookup['brand-ice-200'] = brand['ice-200']
    if 'app-background-smoke-50' in brand:
        color_lookup['brand-app-background-smoke-50'] = brand['app-background-smoke-50']
        color_lookup['brand-app-background-(smoke-50)'] = brand['app-background-smoke-50']

if 'storm' in base_styles.get('colors', {}):
    color_lookup['storm-100'] = base_styles['colors']['storm']['100']
    color_lookup['storm-200'] = base_styles['colors']['storm']['200']

if 'smoke' in base_styles.get('colors', {}):
    color_lookup['smoke-750'] = base_styles['colors']['smoke']['750']

if 'gray-true' in base_styles.get('colors', {}):
    color_lookup['gray-true-50'] = base_styles['colors']['gray-true']['50']

# Special variable mappings
color_lookup['border-default'] = color_lookup.get('storm-100', '#DDE6F1FF')

def resolve_value(value):
    """Resolve a single value (either hex or variable reference)"""
    # If it's already a hex color, return it
    if isinstance(value, str) and value.startswith('#'):
        return value
    
    # If it's a variable reference
    if isinstance(value, str) and value.startswith('$'):
        # Clean the variable name
        clean_key = value.replace('$', '')
        clean_key = clean_key.replace('Colors-', '')
        clean_key = clean_key.replace('(', '').replace(')', '')
        
        # Try various lookup patterns
        patterns = [
            clean_key.lower(),
            clean_key.lower().replace('-', '.'),
            clean_key,
        ]
        
        for pattern in patterns:
            if pattern in color_lookup:
                return color_lookup[pattern]
        
        print(f"⚠️  Warning: Could not resolve variable: {value}")
        return value
    
    return value

def resolve_object(obj):
    """Recursively resolve all values in an object"""
    if isinstance(obj, dict):
        return {key: resolve_object(value) for key, value in obj.items()}
    else:
        return resolve_value(obj)

# Generate resolved JSON
resolved_colors = {
    'meta': {
        'version': '1.0.0',
        'description': 'Sentinel design system color mappings with resolved hex values',
        'generatedFrom': ['base-styles.json', 'sentinel-ds-colors-mapped.json'],
        'generatedAt': datetime.utcnow().isoformat() + 'Z'
    }
}

# Add resolved light and dark themes
for theme in ['light', 'dark']:
    if theme in mapped_colors:
        resolved_colors[theme] = resolve_object(mapped_colors[theme])

# Write resolved JSON
with open(RESOLVED_OUTPUT_PATH, 'w') as f:
    json.dump(resolved_colors, f, indent=2)

print('✅ Generated: sentinel-ds-colors-resolved.json')

# Generate CSS custom properties
def generate_css_vars(obj, prefix='', indent='  '):
    """Generate CSS custom property declarations"""
    lines = []
    
    for key, value in obj.items():
        css_key = f"{prefix}-{key}" if prefix else key
        
        if isinstance(value, dict):
            lines.extend(generate_css_vars(value, css_key, indent))
        elif isinstance(value, str):
            lines.append(f"{indent}--{css_key}: {value};")
    
    return lines

light_css = generate_css_vars(resolved_colors.get('light', {}))
dark_css = generate_css_vars(resolved_colors.get('dark', {}))

css_content = f"""/**
 * Sentinel Design System - Color Tokens
 * 
 * Auto-generated from base-styles.json and sentinel-ds-colors-mapped.json
 * Generated at: {datetime.utcnow().isoformat()}Z
 * 
 * Usage in Vue:
 * 
 * <style>
 * @import './sentinel-ds-colors.css';
 * 
 * .card {{
 *   background-color: var(--bg-surface-card);
 *   color: var(--text-primary);
 * }}
 * </style>
 * 
 * Toggle themes:
 * document.documentElement.setAttribute('data-theme', 'dark');
 */

:root {{
  /* Light theme (default) */
{chr(10).join(light_css)}
}}

[data-theme="dark"] {{
  /* Dark theme */
{chr(10).join(dark_css)}
}}
"""

with open(CSS_OUTPUT_PATH, 'w') as f:
    f.write(css_content)

print('✅ Generated: sentinel-ds-colors.css')

print('\n🎉 Build complete!\n')
print('Files generated:')
print('  - sentinel-ds-colors-resolved.json (for JavaScript/Vue import)')
print('  - sentinel-ds-colors.css (for CSS custom properties)')
print('\nSource files (DO NOT MODIFY GENERATED FILES):')
print('  - base-styles.json (hex color definitions)')
print('  - sentinel-ds-colors-mapped.json (theme mappings)')
