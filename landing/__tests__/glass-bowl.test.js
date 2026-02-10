/**
 * Glass Bowl Memory Cleanup Tests
 * 
 * These tests verify that the glass-bowl.html visualization properly
 * cleans up resources to prevent memory leaks.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const htmlPath = join(__dirname, '..', 'glass-bowl.html');
const htmlContent = readFileSync(htmlPath, 'utf-8');

describe('Glass Bowl Memory Cleanup', () => {
  describe('Resource Management', () => {
    it('should have a destroy() function defined', () => {
      assert.ok(htmlContent.includes('function destroy()'), 
        'destroy() function must be defined');
    });

    it('should store refreshTimer ID for cleanup', () => {
      assert.ok(htmlContent.includes('let refreshTimer = null'),
        'refreshTimer must be stored as a variable');
    });

    it('should clear setInterval on cleanup', () => {
      assert.ok(htmlContent.includes('clearInterval(refreshTimer)'),
        'clearInterval must be called on refreshTimer during cleanup');
    });

    it('should add beforeunload listener to clear interval', () => {
      assert.ok(htmlContent.includes('beforeunload') && 
                htmlContent.includes('destroy()'),
        'beforeunload listener must call destroy()');
    });

    it('should store resize handler reference for cleanup', () => {
      assert.ok(htmlContent.includes('let resizeHandler = null'),
        'resizeHandler must be stored as a variable');
    });

    it('should remove resize listener on cleanup', () => {
      const hasRemoveListener = htmlContent.includes('removeEventListener(\'resize\', resizeHandler)') ||
                                htmlContent.includes("removeEventListener('resize', resizeHandler)");
      assert.ok(hasRemoveListener,
        'resize listener must be removed during cleanup');
    });

    it('should call app.destroy() on cleanup', () => {
      assert.ok(htmlContent.includes('app.destroy('),
        'app.destroy() must be called during cleanup');
    });

    it('should destroy PIXI with children and textures', () => {
      assert.ok(htmlContent.includes('children: true') &&
                htmlContent.includes('texture: true'),
        'app.destroy() must include children and texture cleanup options');
    });

    it('should set app to null after destroy', () => {
      // Check destroy function sets app to null
      const destroyMatch = htmlContent.match(/function destroy\(\)[\s\S]*?app = null/);
      assert.ok(destroyMatch,
        'destroy() must set app to null after cleanup');
    });

    it('should set db to null after close', () => {
      const destroyMatch = htmlContent.match(/function destroy\(\)[\s\S]*?db = null/);
      assert.ok(destroyMatch,
        'destroy() must set db to null after close');
    });
  });

  describe('SQL Statement Cleanup', () => {
    it('should wrap SQL prepare in try/finally blocks', () => {
      // Count try/finally blocks related to SQL statements
      const tryFinallyCount = (htmlContent.match(/try\s*\{[\s\S]*?\}\s*finally/g) || []).length;
      assert.ok(tryFinallyCount >= 3,
        `Expected at least 3 try/finally blocks for SQL cleanup, found ${tryFinallyCount}`);
    });

    it('should call stmt.free() in finally blocks', () => {
      assert.ok(htmlContent.includes('stmt.free()'),
        'stmt.free() must be called to release SQL statements');
    });

    it('should check stmt !== null before calling free', () => {
      assert.ok(htmlContent.includes('if (stmt !== null)') ||
                htmlContent.includes('stmt !== null'),
        'Should check if stmt is not null before freeing');
    });

    it('should have getActiveRuns function', () => {
      assert.ok(htmlContent.includes('function getActiveRuns()'),
        'getActiveRuns function must exist');
    });

    it('should have getStepsForRun function', () => {
      assert.ok(htmlContent.includes('function getStepsForRun(runId)'),
        'getStepsForRun function must exist');
    });

    it('should use try/finally in SQL query functions', () => {
      // Check for the pattern we expect: function -> try -> stmt.prepare -> finally -> stmt.free
      const sqlFunctions = [
        'getActiveRuns',
        'getStepsForRun'
      ];

      for (const fnName of sqlFunctions) {
        const fnRegex = new RegExp(`function ${fnName.replace('(', '\\(')}[\\s\\S]{0,500}?try[\\s\\S]{0,400}finally[\\s\\S]{0,200}stmt\\.free`, 'm');
        assert.ok(fnRegex.test(htmlContent),
          `${fnName} must use try/finally with stmt.free()`);
      }
    });
  });

  describe('Defensive Programming', () => {
    it('should call destroy() at start of init()', () => {
      // Check that init() is an async function and calls destroy() early
      assert.ok(htmlContent.includes('async function init()'),
        'init function must be async');
      
      // The destroy() call should appear early in init after try {
      const initSection = htmlContent.substring(
        htmlContent.indexOf('async function init()'),
        htmlContent.indexOf('async function init()') + 400
      );
      assert.ok(initSection.includes('destroy()'),
        'init() should call destroy() early to handle reinitialization');
    });

    it('should check app exists in resize handler', () => {
      // Find the arrow function assignment for resizeHandler (not the variable declaration)
      // Look for the pattern: resizeHandler = () => { ... if (app)
      const handlerPattern = /resizeHandler\s*=\s*\(\)\s*=>\s*\{[\s\S]*?if\s*\(\s*app\s*\)/;
      assert.ok(handlerPattern.test(htmlContent),
        'resize handler arrow function must check if app exists');
    });

    it('should check app exists before renderVisualization operations', () => {
      assert.ok(htmlContent.includes('if (!app) return;'),
        'renderVisualization should check app exists at start');
    });

    it('should check app exists in renderNoData', () => {
      assert.ok(htmlContent.includes('function renderNoData()'),
        'renderNoData function must exist');
      
      const noDataSection = htmlContent.substring(
        htmlContent.indexOf('function renderNoData()'),
        htmlContent.indexOf('function renderNoData()') + 200
      );
      assert.ok(noDataSection.includes('if (!app) return;'),
        'renderNoData must check app exists');
    });
  });

  describe('Background Tab Handling', () => {
    it('should listen for visibilitychange events', () => {
      assert.ok(htmlContent.includes('visibilitychange'),
        'Should listen for visibilitychange events');
    });

    it('should pause refresh when tab is hidden', () => {
      assert.ok(htmlContent.includes('document.hidden') &&
                htmlContent.includes('clearInterval'),
        'Should clear interval when tab is hidden');
    });

    it('should resume refresh when tab becomes visible', () => {
      assert.ok(htmlContent.includes('!document.hidden') ||
                (htmlContent.includes('document.hidden') && 
                 htmlContent.match(/else[\s\S]{0,200}startAutoRefresh/)),
        'Should resume refresh when tab becomes visible');
    });
  });

  describe('Global State Management', () => {
    it('should initialize all global variables to null', () => {
      assert.ok(htmlContent.includes('let app = null;'),
        'app should be initialized to null');
      assert.ok(htmlContent.includes('let db = null;'),
        'db should be initialized to null');
      assert.ok(htmlContent.includes('let refreshTimer = null;'),
        'refreshTimer should be initialized to null');
      assert.ok(htmlContent.includes('let resizeHandler = null;'),
        'resizeHandler should be initialized to null');
    });

    it('should set refreshTimer to null after clearing', () => {
      const destroyMatch = htmlContent.match(/function destroy\(\)[\s\S]*?refreshTimer = null[\s\S]*?\n\}/);
      assert.ok(destroyMatch || htmlContent.includes('refreshTimer = null'),
        'refreshTimer should be set to null after clearing in destroy()');
    });
  });
});

describe('Glass Bowl File Structure', () => {
  it('should have proper HTML structure', () => {
    assert.ok(htmlContent.includes('<!DOCTYPE html>'),
      'Must have DOCTYPE declaration');
    assert.ok(htmlContent.includes('<html lang="en">'),
      'Must have html element with lang attribute');
  });

  it('should include required CDN scripts', () => {
    assert.ok(htmlContent.includes('pixi.js') || htmlContent.includes('pixi.min.js'),
      'Must include PixiJS');
    assert.ok(htmlContent.includes('sql.js') || htmlContent.includes('sql-wasm.js'),
      'Must include sql.js');
  });

  it('should have canvas container element', () => {
    assert.ok(htmlContent.includes('id="canvas-container"'),
      'Must have canvas-container element');
  });
});
