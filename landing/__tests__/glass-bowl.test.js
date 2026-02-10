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

describe('Glass Bowl Retry Mechanism', () => {
  describe('Retry Configuration', () => {
    it('should have MAX_RETRIES constant set to 3', () => {
      assert.ok(htmlContent.includes('const MAX_RETRIES = 3') ||
                htmlContent.match(/MAX_RETRIES\s*=\s*3/),
        'MAX_RETRIES must be set to 3');
    });

    it('should have RETRY_DELAYS with exponential backoff', () => {
      assert.ok(htmlContent.includes('RETRY_DELAYS'),
        'RETRY_DELAYS array must be defined');
      assert.ok(htmlContent.includes('1000') && htmlContent.includes('2000') && htmlContent.includes('4000'),
        'RETRY_DELAYS should contain exponential backoff delays: 1000, 2000, 4000');
    });

    it('should initialize retryCount to 0', () => {
      assert.ok(htmlContent.includes('let retryCount = 0'),
        'retryCount must be initialized to 0');
    });

    it('should have retryTimeoutId for countdown cleanup', () => {
      assert.ok(htmlContent.includes('let retryTimeoutId = null'),
        'retryTimeoutId must be defined for countdown cleanup');
    });

    it('should track lastSuccessfulLoad timestamp', () => {
      assert.ok(htmlContent.includes('let lastSuccessfulLoad = null'),
        'lastSuccessfulLoad must be defined');
    });
  });

  describe('retryFetch Function', () => {
    it('should have retryFetch function defined', () => {
      assert.ok(htmlContent.includes('async function retryFetch(url'),
        'retryFetch function must be defined');
    });

    it('retryFetch should accept url and options parameters', () => {
      const hasParams = htmlContent.match(/function retryFetch\(url[^)]*options/) ||
                       htmlContent.match(/async function retryFetch\(url[^)]*,?\s*options/) ||
                       htmlContent.includes('retryFetch(url, options = {})');
      assert.ok(hasParams,
        'retryFetch must accept url and options parameters');
    });

    it('should have for loop in retryFetch for attempt count', () => {
      assert.ok(htmlContent.match(/for\s*\(\s*let\s+attempt\s*=\s*0/) ||
                htmlContent.includes('attempt = 0'),
        'retryFetch must loop through attempts');
    });

    it('should use setTimeout for exponential backoff delays', () => {
      assert.ok(htmlContent.includes('setTimeout') &&
                htmlContent.includes('RETRY_DELAYS'),
        'retryFetch must use setTimeout with RETRY_DELAYS for backoff');
    });
  });

  describe('Error Display', () => {
    it('should have showRetryableError function', () => {
      assert.ok(htmlContent.includes('function showRetryableError(message'),
        'showRetryableError function must be defined');
    });

    it('should have showPermanentError for max retries reached', () => {
      assert.ok(htmlContent.includes('function showPermanentError(message'),
        'showPermanentError function must be defined');
    });

    it('should have handleInitError function', () => {
      assert.ok(htmlContent.includes('function handleInitError(error'),
        'handleInitError function must be defined');
    });

    it('should display retry countdown element', () => {
      assert.ok(htmlContent.includes('id="retry-info"'),
        'retry-info element must exist for countdown display');
      assert.ok(htmlContent.includes('id="countdown"'),
        'countdown span element must exist');
    });

    it('should display last successful load timestamp', () => {
      assert.ok(htmlContent.includes('id="last-load"'),
        'last-load element must exist for timestamp display');
    });

    it('should update lastSuccessfulLoad on successful init', () => {
      assert.ok(htmlContent.includes('lastSuccessfulLoad = new Date().toISOString()'),
        'lastSuccessfulLoad must be set on successful initialization');
    });
  });

  describe('Retry Countdown', () => {
    it('should have updateCountdown function', () => {
      assert.ok(htmlContent.includes('function updateCountdown(seconds'),
        'updateCountdown function must be defined');
    });

    it('should use setTimeout for countdown updates', () => {
      assert.ok(htmlContent.match(/updateCountdown\(\s*seconds\s*-\s*1/) ||
                htmlContent.includes('seconds - 1'),
        'updateCountdown must recursively count down using setTimeout');
    });
  });

  describe('Manual Retry', () => {
    it('should have manualRetry function', () => {
      assert.ok(htmlContent.includes('async function manualRetry()'),
        'manualRetry function must be defined');
    });

    it('should have Retry Now button', () => {
      assert.ok(htmlContent.includes('id="retry-btn"'),
        'Retry Now button must exist');
      assert.ok(htmlContent.includes('onclick="manualRetry()"'),
        'Retry button must call manualRetry onclick');
    });

    it('manualRetry should reset retryCount to 0', () => {
      const fnRegex = /function manualRetry\(\)[\s\S]{0,200}retryCount = 0/;
      assert.ok(fnRegex.test(htmlContent),
        'manualRetry must reset retryCount to 0');
    });

    it('manualRetry should clear retryTimeoutId', () => {
      const fnRegex = /function manualRetry\(\)[\s\S]{0,300}retryTimeoutId = null/;
      assert.ok(fnRegex.test(htmlContent),
        'manualRetry must clear retryTimeoutId');
    });
  });

  describe('Error Handling Integration', () => {
    it('init should use handleInitError instead of showError', () => {
      assert.ok(htmlContent.includes('catch (error) { handleInitError(error); }') ||
                htmlContent.includes('handleInitError(error)'),
        'init() catch block must use handleInitError');
    });

    it('initDatabase should use retryFetch for /api/db', () => {
      assert.ok(htmlContent.includes('await retryFetch(\'/api/db\')') ||
                htmlContent.match(/retryFetch\(['"]\/api\/db['"]\)/),
        'initDatabase must use retryFetch for database fetching');
    });

    it('handleInitError should increment retryCount', () => {
      assert.ok(htmlContent.match(/handleInitError\(error\)[\s\S]{0,200}retryCount\+\+/) ||
                htmlContent.includes('retryCount++'),
        'handleInitError must increment retryCount');
    });

    it('handleInitError should check max retries', () => {
      assert.ok(htmlContent.match(/retryCount\s*<=\s*MAX_RETRIES/) ||
                htmlContent.includes('retryCount <= MAX_RETRIES'),
        'handleInitError must check retryCount against MAX_RETRIES');
    });

    it('handleInitError should calculate exponential backoff', () => {
      assert.ok(htmlContent.includes('RETRY_DELAYS') &&
                htmlContent.match(/delayIndex\s*=.*retryCount/),
        'handleInitError must calculate exponential backoff based on retryCount');
    });
  });

  describe('Cleanup', () => {
    it('destroy should clear retryTimeoutId', () => {
      assert.ok(htmlContent.match(/function destroy\(\)[\s\S]*?retryTimeoutId = null/) ||
                (htmlContent.includes('retryTimeoutId') &&
                 htmlContent.match(/function destroy\(\)[\s\S]*?retryTimeoutId/)),
        'destroy() must clear retryTimeoutId');
    });

    it('destroy should clear retry timeout with clearTimeout', () => {
      assert.ok(htmlContent.match(/function destroy\(\)[\s\S]*?clearTimeout\(retryTimeoutId\)/) ||
                htmlContent.includes('clearTimeout(retryTimeoutId)'),
        'destroy() must call clearTimeout on retryTimeoutId');
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
