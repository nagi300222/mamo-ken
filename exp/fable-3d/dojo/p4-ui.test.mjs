import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const tokens=await readFile(new URL('../shared-ui/design-tokens.css',import.meta.url),'utf8');
const values=Object.fromEntries([...tokens.matchAll(/--(ui-[\w-]+):(#[0-9a-f]{6})/gi)].map(m=>[m[1],m[2]]));
const luminance=hex=>{const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(values[a]),y=luminance(values[b]);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('P4 primary reading and action color pairs meet WCAG AA text contrast',()=>{
 for(const [fg,bg] of [['ui-paper','ui-shadow'],['ui-paper','ui-surface'],['ui-muted','ui-surface'],['ui-shadow','ui-gold'],['ui-gold','ui-surface'],['ui-danger','ui-surface']])assert.ok(contrast(fg,bg)>=4.5,fg+'/'+bg+' '+contrast(fg,bg));
});
test('P4 five mode navigation keeps exact existing routes and never mutates saves',async()=>{
 const html=await readFile(new URL('../lobby/index.html',import.meta.url),'utf8'),js=await readFile(new URL('../lobby/main.js',import.meta.url),'utf8');
 const links=[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*data-mode="([^"]+)"/g)].map(m=>[m[2],m[1]]);
 assert.deepEqual(new Map(links),new Map([['battle','./dojo/?mode=battle'],['practice','./dojo/?mode=practice'],['arcade','./dojo/?mode=arcade'],['survival','./dojo/?mode=survival'],['story','./story/']]));
 assert.ok(!/setItem|removeItem|\.clear\(/.test(js));
});
