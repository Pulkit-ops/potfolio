/**
 * Inline <head> script that classifies the device before first paint and
 * writes <html data-tier data-pointer [data-webgl="off"]>. Tier semantics are
 * documented in ./renderTier.ts. Kept dependency-free and ES5.
 */
export const TIER_BOOT_SCRIPT = `(function(){try{
var d=document.documentElement,n=navigator,m=function(q){return window.matchMedia&&matchMedia(q).matches};
var reduce=m('(prefers-reduced-motion: reduce)');
var fine=m('(hover: hover) and (pointer: fine)');
var c=n.connection||{};
var slow=!!c.saveData||/(^|-)(2g|3g)$/.test(c.effectiveType||'');
var cores=n.hardwareConcurrency||4,mem=n.deviceMemory||4;
var gl=!!window.WebGLRenderingContext;
var tier=(reduce||slow||mem<=2||cores<=2)?'low':((!fine||cores<=4||mem<=4)?'medium':'high');
d.setAttribute('data-tier',tier);
d.setAttribute('data-pointer',fine?'fine':'coarse');
if(!gl)d.setAttribute('data-webgl','off');
}catch(e){}})();`;
