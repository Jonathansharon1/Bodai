#!/usr/bin/env node

/**
 * Script to find potentially hardcoded user-facing strings in React components
 * 
 * Usage: node scripts/find-hardcoded-strings.js
 * 
 * This script searches for common patterns that indicate hardcoded strings
 * that should be translated.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '../client/src');
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /console\.(log|warn|error)/,
  /\/\/.*/,
  /\/\*[\s\S]*?\*\//,
];

// Patterns that indicate user-facing strings
const USER_FACING_PATTERNS = [
  // JSX text content: >Text<
  />\s*[A-Z][^<>{}\n]{3,}\s*</g,
  // String literals in JSX attributes
  /(placeholder|aria-label|title|alt)="[^"]{5,}"/g,
  // Template literals that might be user-facing
  /`[A-Z][^`]{10,}`/g,
  // Alert/confirm messages
  /(alert|confirm|prompt)\s*\(['"`][^'"`]{10,}['"`]\)/g,
];

// Patterns that are OK (already using i18n)
const OK_PATTERNS = [
  /t\(/,
  /useTranslation/,
  /i18n\./,
  /process\.env/,
  /className/,
  /style=/,
  /href=/,
  /src=/,
  /id=/,
  /key=/,
  /data-/,
];

function getAllJsxFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (IGNORE_PATTERNS.some(pattern => pattern.test(fullPath))) {
      continue;
    }
    
    if (entry.isDirectory()) {
      files.push(...getAllJsxFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function findHardcodedStrings(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  // Check if file uses i18n
  const usesI18n = /useTranslation|i18n|t\(/.test(content);
  
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }
    
    // Check each pattern
    USER_FACING_PATTERNS.forEach(pattern => {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const matchedText = match[0];
        
        // Skip if it's already using i18n
        if (OK_PATTERNS.some(ok => ok.test(line))) {
          return;
        }
        
        // Skip if it's clearly not user-facing
        if (matchedText.includes('className') || 
            matchedText.includes('style') ||
            matchedText.includes('http') ||
            matchedText.includes('@') ||
            matchedText.match(/^[A-Z_][A-Z0-9_]*$/)) { // Constants
          return;
        }
        
        issues.push({
          file: path.relative(SRC_DIR, filePath),
          line: index + 1,
          text: matchedText.substring(0, 60),
          usesI18n
        });
      }
    });
  });
  
  return issues;
}

function main() {
  console.log('🔍 Scanning for hardcoded user-facing strings...\n');
  
  const files = getAllJsxFiles(SRC_DIR);
  console.log(`Found ${files.length} JSX/JS files to check\n`);
  
  const allIssues = [];
  const filesWithoutI18n = [];
  
  files.forEach(file => {
    const issues = findHardcodedStrings(file);
    if (issues.length > 0) {
      allIssues.push(...issues);
    }
    
    // Check if file has user-facing text but no i18n
    const content = fs.readFileSync(file, 'utf8');
    const hasText = />\s*[A-Z][^<>{}\n]{5,}\s*</.test(content);
    const hasI18n = /useTranslation|i18n|t\(/.test(content);
    
    if (hasText && !hasI18n) {
      filesWithoutI18n.push(path.relative(SRC_DIR, file));
    }
  });
  
  // Group issues by file
  const issuesByFile = {};
  allIssues.forEach(issue => {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  });
  
  // Print results
  if (Object.keys(issuesByFile).length > 0) {
    console.log('⚠️  Potential hardcoded strings found:\n');
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      console.log(`📄 ${file}`);
      issues.forEach(issue => {
        const icon = issue.usesI18n ? '✅' : '❌';
        console.log(`   ${icon} Line ${issue.line}: ${issue.text}`);
      });
      console.log();
    });
  } else {
    console.log('✅ No obvious hardcoded strings found!\n');
  }
  
  if (filesWithoutI18n.length > 0) {
    console.log('📋 Files with text but no i18n import:\n');
    filesWithoutI18n.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log();
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files checked: ${files.length}`);
  console.log(`   Files with potential issues: ${Object.keys(issuesByFile).length}`);
  console.log(`   Total potential issues: ${allIssues.length}`);
  console.log(`   Files without i18n: ${filesWithoutI18n.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { findHardcodedStrings, getAllJsxFiles };

