import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const landingDir = resolve(__dirname, '..');

describe('Glass Bowl visualization', () => {
  it('glass-bowl.html exists', () => {
    assert.ok(existsSync(resolve(landingDir, 'glass-bowl.html')));
  });

  it('glass-bowl.html loads PixiJS from CDN', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('pixi.js@7'), 'missing PixiJS CDN link');
    assert.ok(html.includes('cdn.jsdelivr.net'), 'missing jsdelivr CDN');
  });

  it('glass-bowl.html loads sql.js from CDN', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('sql.js@1'), 'missing sql.js CDN link');
    assert.ok(html.includes('sql-wasm.js'), 'missing sql-wasm.js');
  });

  it('glass-bowl.html has full-screen canvas container', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('width: 100vw'), 'missing full viewport width');
    assert.ok(html.includes('height: 100vh'), 'missing full viewport height');
    assert.ok(html.includes('overflow: hidden'), 'missing overflow hidden');
  });

  it('glass-bowl.html has dirt-colored background (#3d3328)', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('#3d3328'), 'missing dirt background color');
    assert.ok(html.includes('backgroundColor: 0x3d3328'), 'missing PixiJS background color');
  });

  it('glass-bowl.html has loading indicator', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('id="loading"'), 'missing loading element');
    assert.ok(html.includes('Loading database'), 'missing loading text');
  });

  it('glass-bowl.html has proper HTML structure', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('<!DOCTYPE html>'), 'missing doctype');
    assert.ok(html.includes('<title>'), 'missing title');
    assert.ok(html.includes('<meta charset="UTF-8">'), 'missing charset meta');
    assert.ok(html.includes('<meta name="viewport"'), 'missing viewport meta');
  });

  it('glass-bowl.html includes PixiJS initialization code', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('PIXI.Application'), 'missing PIXI.Application');
    assert.ok(html.includes('new PIXI'), 'missing PIXI instantiation');
  });

  it('glass-bowl.html includes SQL.js initialization code', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('initSqlJs'), 'missing initSqlJs call');
    assert.ok(html.includes('new SQL.Database'), 'missing SQL.Database creation');
  });

  it('glass-bowl.html has error display element', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('id="error"'), 'missing error element');
    assert.ok(html.includes('id="error-message"'), 'missing error-message element');
  });

  it('glass-bowl.html has status colors defined', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('STATUS_COLORS'), 'missing STATUS_COLORS');
    assert.ok(html.includes('running:'), 'missing running status color');
    assert.ok(html.includes('failed:'), 'missing failed status color');
  });

  it('glass-bowl.html has auto-refresh logic', () => {
    const html = readFileSync(resolve(landingDir, 'glass-bowl.html'), 'utf-8');
    assert.ok(html.includes('setInterval'), 'missing setInterval for auto-refresh');
    assert.ok(html.includes('REFRESH_INTERVAL') || html.includes('5000'), 'missing refresh interval');
  });
});
