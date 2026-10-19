/*! Gym Republik — Design your gym form v1.0.7 */
(function () {
  'use strict';
  var SCRIPT = document.currentScript;
  var cfg = function (k, d) { return (SCRIPT && SCRIPT.getAttribute('data-' + k)) || d; };
  var EP = cfg('endpoint', 'https://gym-republik-submit.matt-572.workers.dev/submit');
  var HOME = cfg('home', '/');
  var PHONE = cfg('phone', '0161 524 7618');
  var AUTO = cfg('auto', 'true') !== 'false';
  var EASE = 'cubic-bezier(.2,.7,0,1)';
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CSS = [
    '.grf{--n:#0f1130;--t:#277682;--t4:#7fbcc4;--bg:#f9f9f7;--cr:#f3eee7;display:grid;grid-template-columns:minmax(0,1fr) clamp(260px,24vw,340px);background:var(--bg);color:var(--n);font-family:inherit;min-height:0;box-sizing:border-box;-webkit-font-smoothing:antialiased}',
    '.grf *,.grf *::before,.grf *::after{box-sizing:border-box}',
    '.grf button{font-family:inherit}',
    '.grf-main{padding:0 clamp(24px,3.4vw,48px) clamp(24px,3.4vw,48px);display:flex;flex-direction:column;gap:clamp(20px,2.4vw,32px);min-width:0;align-self:start}',
    '.grf-top{display:flex;flex-direction:column;gap:16px}',
    '.grf-meta,.grf-hint,.grf-flab,.grf-back,.grf-brief-h,.grf-small-caps{font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase}',
    '.grf-meta{display:flex;justify-content:space-between;gap:16px}',
    '.grf-meta-l{display:flex;gap:12px}.grf-muted{color:rgba(15,17,48,.45)}',
    '.grf-count{font-variant-numeric:tabular-nums}.grf-count b,.grf-brief-c b{color:var(--t);font-weight:600}',
    '.grf-segs{display:flex;gap:6px}',
    '.grf-seg{flex:1;height:4px;background:rgba(15,17,48,.12);position:relative;overflow:hidden}',
    '.grf-seg::after{content:"";position:absolute;inset:0;background:var(--t);transform:scaleX(0);transform-origin:left;transition:transform .6s ' + EASE + '}',
    '.grf-seg.is-on::after{transform:scaleX(1)}',
    '.grf-body{flex:1;display:flex;flex-direction:column}',
    '.grf-q{display:flex;flex-direction:column;gap:clamp(20px,2.2vw,28px);flex:1}',
    '.grf-head{display:flex;flex-direction:column;gap:12px;border-top:2px solid var(--n);padding-top:20px}',
    '.grf-h{margin:0;font-family:inherit;text-transform:none;font-weight:800;font-size:clamp(32px,4.4vw,68px);line-height:.92;letter-spacing:-.045em;text-wrap:balance;max-width:18ch;color:var(--n)}',
    '.grf-h-xl{font-size:clamp(40px,6vw,96px);line-height:.88;letter-spacing:-.05em;text-transform:uppercase;max-width:none}',
    '.grf-note{margin:0;font-size:18px;line-height:1.5;max-width:52ch;text-wrap:pretty}',
    '.grf-hint{color:var(--t)}',
    '.grf-opts{display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));padding:0 0 2px 2px}',
    '.grf-opt{all:unset;box-sizing:border-box;cursor:pointer;margin:0 0 -2px -2px;border:2px solid var(--n);min-height:168px;padding:20px;display:flex;flex-direction:column;gap:16px;background:var(--bg);color:var(--n);transition:background .35s ease,color .35s ease,box-shadow .35s ease}',
    '.grf-opt:hover{box-shadow:inset 0 -6px 0 var(--t)}',
    '.grf-opt:focus-visible{outline:2px solid var(--t);outline-offset:2px;position:relative;z-index:1}',
    '.grf-opt.is-on{background:var(--n);color:var(--bg)}',
    '.grf-opt-top{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600;letter-spacing:.24em}',
    '.grf-letter{color:var(--t)}.grf-opt.is-on .grf-letter{color:var(--t4)}',
    '.grf-mark{width:16px;height:16px;border:2px solid currentColor;opacity:0}',
    '.grf-opt.is-multi .grf-mark,.grf-opt.is-on .grf-mark{opacity:1}.grf-opt.is-on .grf-mark{background:var(--t)}',
    '.grf-vis{display:flex;align-items:center;height:52px;margin-top:auto}',
    '.grf-ico{display:block;width:44px;height:44px}.grf-ico svg{display:block}',
    '.grf-vis{container-type:inline-size;width:100%;min-width:0}.grf-big{font-weight:800;font-size:clamp(24px,3.4vw,52px);font-size:min(clamp(24px,3.4vw,52px),19cqi);line-height:.9;letter-spacing:-.04em;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.grf-lab{display:flex;flex-direction:column;gap:4px}',
    '.grf-lab-t{font-size:clamp(17px,1.4vw,20px);font-weight:600;line-height:1.15;letter-spacing:-.01em}',
    '.grf-sub{font-size:14px;line-height:1.3;min-height:1.3em;opacity:.7}',
    '.grf-nav{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:2px solid rgba(15,17,48,.12);padding-top:20px}',
    '.grf-nav[hidden]{display:none}',
    '.grf-back{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:12px;min-height:44px;font-size:12px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;transition:opacity .3s ease,color .3s ease}',
    '.grf-back:hover{color:var(--t)}.grf-back[disabled]{opacity:0;pointer-events:none}.grf-back span:first-child{font-weight:400;font-size:18px;letter-spacing:0}',
    '.grf-btn{all:unset;box-sizing:border-box;cursor:pointer;position:relative;overflow:hidden;isolation:isolate;display:inline-flex;justify-content:space-between;align-items:center;gap:48px;min-width:min(100%,280px);padding:18px 22px;font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;transition:color .35s ease .12s}',
    '.grf-btn>span:last-child{font-weight:400;font-size:18px;letter-spacing:0}',
    '.grf-fill{position:absolute;inset:0;z-index:-1;transform:scaleX(0);transform-origin:left;transition:transform .6s cubic-bezier(.7,0,.2,1)}',
    '.grf-btn:hover .grf-fill{transform:scaleX(1)}',
    '.grf-btn:focus-visible,.grf-back:focus-visible,.grf-row:focus-visible,.grf-ghost:focus-visible{outline:2px solid var(--t);outline-offset:2px}',
    '.grf-btn-navy{background:var(--n);color:var(--bg)}.grf-btn-navy .grf-fill{background:var(--t)}.grf-btn-navy:hover{color:var(--bg)}',
    '.grf-btn-teal{background:var(--t);color:#fff}.grf-btn-teal .grf-fill{background:var(--n)}.grf-btn-teal:hover{color:#fff}',
    '.grf-btn[disabled]{opacity:.35;cursor:not-allowed}.grf-btn[disabled] .grf-fill{display:none}',
    '.grf-ghost{all:unset;cursor:pointer;padding:18px 22px;box-shadow:inset 0 0 0 2px var(--n);font-size:13px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}',
    '.grf-ghost:hover{background:var(--cr)}',
    '.grf-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:32px 24px;position:relative}',
    '.grf-field{display:flex;flex-direction:column;gap:10px}',
    '.grf-flab{display:flex;align-items:center;transition:color .4s ease}',
    '.grf-dash{display:block;flex:none;width:0;height:2px;margin-right:0;background:var(--t);transition:width .6s cubic-bezier(.7,0,.2,1),margin .6s cubic-bezier(.7,0,.2,1)}',
    '.grf-ok{margin-left:auto;color:var(--t)}',
    '.grf-field:focus-within .grf-flab{color:var(--t)}.grf-field:focus-within .grf-dash{width:28px;margin-right:14px}',
    '.grf-field input{all:unset;box-sizing:border-box;width:100%;padding:12px 0 14px;font-size:20px;color:var(--n);font-weight:400;letter-spacing:-.01em;caret-color:var(--t);border-bottom:2px solid rgba(15,17,48,.25);background-image:linear-gradient(var(--t),var(--t));background-position:left bottom;background-repeat:no-repeat;background-size:0% 3px;transition:background-size .8s cubic-bezier(.7,0,.2,1),border-color .4s ease,color .3s ease}',
    '.grf-field input:hover{border-bottom-color:rgba(15,17,48,.55)}',
    '.grf-field input:focus{background-size:100% 3px;border-bottom-color:rgba(15,17,48,.12);outline:0}',
    '.grf-field input:not(:placeholder-shown):not(:focus){border-bottom-color:var(--n)}',
    '.grf-field input::placeholder{color:rgba(15,17,48,.32);font-weight:300;letter-spacing:-.01em;opacity:1;transition:color .4s ease}',
    '.grf-field input:focus::placeholder{color:rgba(15,17,48,.16)}',
    '.grf-field.has-err .grf-flab{color:#b3261e}.grf-field.has-err input:not(:focus){border-bottom-color:#b3261e}',
    '.grf-err{font-size:14px;color:#b3261e}.grf-err:empty{display:none}',
    '.grf-hp{position:absolute!important;left:-9999px!important;width:1px;height:1px;opacity:0}',
    '.grf-send-err{grid-column:1/-1;font-size:15px;color:#b3261e}.grf-send-err:empty{display:none}',
    '.grf-submit{grid-column:1/-1;justify-self:start;width:auto;min-width:280px;gap:48px;padding:20px 22px}.grf-nav.is-final{border-top:0;padding-top:0}',
    '.grf-small{grid-column:1/-1;font-size:13px;line-height:1.5;color:rgba(15,17,48,.6)}',
    '.grf-done{gap:28px;border-top:2px solid var(--n);padding-top:24px}.grf-done .grf-note{max-width:44ch;font-size:clamp(18px,1.4vw,21px)}',
    '.grf-done-btns{display:flex;gap:12px;flex-wrap:wrap}.grf-done-btns .grf-btn{gap:40px;min-width:0}',
    '.grf-brief{border-left:2px solid var(--n);background:var(--cr);padding:clamp(24px,3.4vw,48px) clamp(20px,2.4vw,32px)}',
    '.grf-brief-in{position:sticky;top:100px;display:flex;flex-direction:column}',
    '.grf-brief-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding-bottom:14px;border-bottom:2px solid var(--n)}',
    '.grf-brief-c{font-variant-numeric:tabular-nums}',
    '.grf-row{all:unset;box-sizing:border-box;width:100%;cursor:default;position:relative;display:grid;grid-template-columns:1fr auto;gap:6px 12px;padding:16px 0;border-bottom:2px solid rgba(15,17,48,.12)}',
    '.grf-row.is-has:not(.is-cur){cursor:pointer}.grf-row.is-has:not(.is-cur):hover{color:var(--t)}',
    '.grf-row-k{font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:rgba(15,17,48,.3);transition:color .4s ease}',
    '.grf-row.is-has .grf-row-k{color:rgba(15,17,48,.55)}.grf-row.is-cur .grf-row-k{color:var(--t)}',
    '.grf-row-e{grid-row:span 2;align-self:center;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--t);opacity:0;transition:opacity .4s ease}',
    '.grf-row.is-has:not(.is-cur) .grf-row-e{opacity:1}',
    '.grf-row-v{font-size:17px;line-height:1.3;color:rgba(15,17,48,.3);transition:color .4s ease}',
    '.grf-row.is-has .grf-row-v{color:var(--n)}.grf-row.is-cur:not(.is-has) .grf-row-v{color:var(--t)}',
    '.grf-row::after{content:"";position:absolute;left:0;right:0;bottom:-2px;height:2px;background:var(--t);transform:scaleX(0);transform-origin:left;transition:transform .8s ' + EASE + '}',
    '.grf-row.is-has::after{transform:scaleX(1)}',
    '@media (max-width:900px){.grf{grid-template-columns:minmax(0,1fr)}.grf-brief{border-left:0;border-top:2px solid var(--n)}.grf-brief-in{position:static}}',
    '@media (max-width:640px){.grf-opts{grid-template-columns:repeat(2,minmax(0,1fr))!important}.grf-opt{min-height:168px;padding:16px}.grf-muted{display:none}.grf-form{grid-template-columns:minmax(0,1fr)}.grf-form>*{grid-column:1/-1!important}.grf-q{min-height:0}' +
      '.grf-nav .grf-tx{display:none}.grf-back{width:64px;height:56px;justify-content:center;gap:0;box-shadow:inset 0 0 0 2px var(--n)}.grf-next{min-width:0;width:64px;height:56px;padding:0;justify-content:center;gap:0}.grf-big{font-size:clamp(22px,6.6vw,32px);letter-spacing:-.03em;white-space:normal}' +
      '.grf-opts[data-n="3"]{grid-template-columns:minmax(0,1fr)!important}' +
      '.grf-opts[data-n="3"] .grf-opt{min-height:0;flex-direction:row;align-items:center;gap:16px;padding:16px 18px}' +
      '.grf-opts[data-n="3"] .grf-opt-top{order:3;margin-left:auto}.grf-opts[data-n="3"] .grf-letter{display:none}' +
      '.grf-opts[data-n="3"] .grf-vis{margin-top:0;height:44px;flex:none;width:auto;container-type:normal}.grf-opts[data-n="3"] .grf-lab{order:2}.grf-opts[data-n="3"] .grf-sub:empty{display:none}}'
,
    '@media (max-width:640px){.grf-submit{justify-self:stretch;width:100%;min-width:0}}'
,
    '.grf-field input:-webkit-autofill,.grf-field input:-webkit-autofill:hover,.grf-field input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px var(--bg) inset;box-shadow:0 0 0 1000px var(--bg) inset;-webkit-text-fill-color:var(--n);caret-color:var(--t);transition:background-color 99999s ease 0s;animation-name:grfAutofill}',
    '.grf-field input:autofill{background:var(--bg)}',
    '@keyframes grfAutofill{from{opacity:1}to{opacity:1}}'
  ].join('\n');

  var I = {
    garage1: ['M3 21V9l9-5 9 5v12', 'M7 21v-9h10v9', 'M7 15h10', 'M7 18h10'],
    garage2: ['M2 21V9l10-5 10 5v12', 'M5 21v-9h6.5v9', 'M12.5 21v-9H19v9', 'M5 16h6.5', 'M12.5 16H19'],
    garden: ['M3 21V11l9-8 9 8v10Z', 'M12 3v18', 'M3 15h18', 'M7.5 7v14', 'M16.5 7v14'],
    house: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8', 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
    user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'],
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    dumbbell: ['M14.4 14.4 9.6 9.6', 'M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z', 'm21.5 21.5-1.4-1.4', 'M3.9 3.9 2.5 2.5', 'M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z'],
    mirror: ['M6 21V8a6 6 0 0 1 12 0v13', 'M4 21h16', 'M10 7.5a2.5 2.5 0 0 1 2-2'],
    layers: ['M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z', 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12', 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17'],
    pulse: ['M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2'],
    plus: ['M5 12h14', 'M12 5v14'],
    pad1: ['M3 11h18v4H3z'],
    pad2: ['M3 5h18v4H3z', 'M3 10.5h18v4H3z', 'M3 16h18v4H3z'],
    mirStd: ['M7 3h10v18H7z'],
    mirFull: ['M2 2h20', 'M2 22h20', 'M8 2v20', 'M16 2v20'],
    pen: ['M12 20h9', 'M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z'],
    zap: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z']
  };
  var D = {
    where: { k: 'Space', title: "Where's it going to go?", hint: 'Pick one', opts: [['Single garage', I.garage1], ['Double garage', I.garage2], ['Garden room', I.garden], ['Spare room', I.house]] },
    who: { k: 'Users', title: "Who's going to use it?", hint: 'Pick one', opts: [['Just me', I.user], ['The family', I.users]] },
    help: { k: 'Scope', title: 'What do you need help with?', hint: 'Select all that apply', multi: true, opts: [['Equipment', I.dumbbell], ['Flooring', I.layers], ['Mirrors', I.mirror]] },
    equip: { k: 'Equipment', title: "What's your equipment focus?", hint: 'Pick one', opts: [['Resistance', I.dumbbell], ['Cardio', I.pulse], ['Both', I.plus]] },
    floor: { k: 'Flooring', title: 'Which flooring would you like?', hint: 'Pick one', opts: [['Standard padding', I.pad1, 'For most training'], ['Extra padding', I.pad2, 'For heavy lifting']] },
    mirror: { k: 'Mirrors', title: 'Which mirrors would you like?', hint: 'Pick one', opts: [['Standard', I.mirStd, '1m × 1.8m'], ['Floor to ceiling', I.mirFull], ['Bespoke', I.pen, 'Made to measure']] },
    when: { k: 'Start', title: 'When would you like to start?', hint: 'Pick one', opts: [['ASAP', I.zap], ['Next month', null, null, '1'], ['Next 3 months', null, null, '3'], ['Next 6–12 months', null, null, '6–12']] }
  };
  var F = [
    ['first', 'First name', 'text', 'given-name', 'Jane'],
    ['last', 'Last name', 'text', 'family-name', 'Smith'],
    ['phone', 'Phone', 'tel', 'tel', '07700 900000'],
    ['phone2', 'Confirm phone', 'tel', 'nope', 'Type it again'],
    ['email', 'Email', 'email', 'email', 'you@example.com'],
    ['postcode', 'Postcode', 'text', 'postal-code', 'M1 1AA']
  ];

  var S, E, T, t0, seen, started;
  function reset() { S = { i: 0, a: { help: [] }, f: {}, done: false, busy: false, sending: false }; t0 = Date.now(); seen = {}; started = false; }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function p2(n) { return String(n).padStart(2, '0'); }
  function svg(ps) { return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ps.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</svg>'; }
  function ukPhone(v) {
    var d = (v || '').replace(/[^\d+]/g, '');
    if (d.indexOf('+44') === 0) d = '0' + d.slice(3); else if (d.indexOf('0044') === 0) d = '0' + d.slice(4); else if (d.indexOf('44') === 0 && d.length === 12) d = '0' + d.slice(2);
    d = d.replace(/\D/g, '');
    return /^0[1237]\d{9}$/.test(d) ? d : null;
  }
  function fmtPhone(d) { return d.indexOf('07') === 0 ? d.slice(0, 5) + ' ' + d.slice(5) : d.slice(0, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7); }
  function flow() {
    var h = S.a.help || [];
    return ['where', 'who', 'help'].concat(h.indexOf('Equipment') > -1 ? ['equip'] : [], h.indexOf('Flooring') > -1 ? ['floor'] : [], h.indexOf('Mirrors') > -1 ? ['mirror'] : [], ['when', 'contact']);
  }
  function cur() { return Math.min(S.i, flow().length - 1); }
  function has(k) { var v = S.a[k]; return Array.isArray(v) ? v.length > 0 : !!v; }

  function track(event, params) {
    var o = { event: event, form_id: 'design_your_gym' }; for (var k in params) o[k] = params[k];
    try { (window.dataLayer = window.dataLayer || []).push(o); if (typeof window.gtag === 'function') { var g = {}; for (var j in o) if (j !== 'event') g[j] = o[j]; window.gtag('event', event, g); } } catch (e) {}
  }
  function trackStep() {
    if (S.done) return;
    var fl = flow(), i = cur(), id = fl[i];
    if (seen[id]) return; seen[id] = 1;
    track('gym_form_step', { step_id: id, step_name: D[id] ? D[id].title : 'Contact details', step_number: i + 1, total_steps: fl.length });
  }

  /* ---------- render ---------- */
  function renderTop() {
    var fl = flow(), i = cur();
    E.count.innerHTML = '<b>' + p2(S.done ? fl.length : i + 1) + '</b>&nbsp;/&nbsp;' + p2(fl.length);
    while (E.segs.children.length < fl.length) { var s = document.createElement('span'); s.className = 'grf-seg'; E.segs.appendChild(s); }
    while (E.segs.children.length > fl.length) E.segs.removeChild(E.segs.lastChild);
    [].forEach.call(E.segs.children, function (s, k) { s.classList.toggle('is-on', S.done || k <= i); });
  }
  function optHTML(q, id, o, j) {
    var on = q.multi ? (S.a[id] || []).indexOf(o[0]) > -1 : S.a[id] === o[0];
    return '<button type="button" class="grf-opt' + (q.multi ? ' is-multi' : '') + (on ? ' is-on' : '') + '" data-v="' + esc(o[0]) + '" aria-pressed="' + on + '">' +
      '<span class="grf-opt-top"><span class="grf-letter">' + String.fromCharCode(65 + j) + '</span><span class="grf-mark"></span></span>' +
      '<span class="grf-vis">' + (o[1] ? '<span class="grf-ico">' + svg(o[1]) + '</span>' : '') + (o[3] ? '<span class="grf-big">' + esc(o[3]) + '</span>' : '') + '</span>' +
      '<span class="grf-lab"><span class="grf-lab-t">' + esc(o[0]) + '</span><span class="grf-sub">' + esc(o[2] || '') + '</span></span></button>';
  }
  function renderBody() {
    var id = flow()[cur()], q = D[id], h;
    if (S.done) {
      h = '<div class="grf-q grf-done"><span class="grf-hint">Brief received</span><h1 class="grf-h grf-h-xl">Thanks, ' + esc((S.f.first || '').trim() || 'there') + '.</h1>' +
        '<p class="grf-note">Your brief is with the team. We\'ll be in touch shortly with your free quote and an example layout to match.</p>' +
        '<div class="grf-done-btns"><a class="grf-btn grf-btn-navy" href="' + esc(HOME) + '"><span class="grf-fill"></span><span>Back to home</span><span>→</span></a><button type="button" class="grf-ghost" data-restart>Start again</button></div></div>';
    } else if (q) {
      h = '<div class="grf-q"><div class="grf-head"><h1 class="grf-h">' + esc(q.title) + '</h1>' + (q.note ? '<p class="grf-note">' + esc(q.note) + '</p>' : '') + (q.multi ? '<span class="grf-hint">' + esc(q.hint) + '</span>' : '') + '</div>' +
        '<div class="grf-opts" data-n="' + q.opts.length + '" style="--cols:' + q.opts.length + '">' + q.opts.map(function (o, j) { return optHTML(q, id, o, j); }).join('') + '</div></div>';
    } else {
      h = '<div class="grf-q"><div class="grf-head"><h1 class="grf-h">Where should we send it?</h1></div>' +
        '<form class="grf-form" novalidate>' + F.map(function (f) {
          return '<label class="grf-field" data-k="' + f[0] + '"><span class="grf-flab"><span class="grf-dash"></span><span>' + f[1] + '</span><span class="grf-ok"></span></span>' +
            '<input type="' + f[2] + '" name="' + (f[0] === 'phone2' ? 'grf-verify-' + Math.random().toString(36).slice(2, 7) : f[0]) + '"' + (f[0] === 'phone2' ? ' data-lpignore="true" data-1p-ignore data-form-type="other"' : '') + ' autocomplete="' + f[3] + '" placeholder="' + f[4] + '" value="' + esc(S.f[f[0]] || '') + '"' + (f[2] === 'tel' ? ' inputmode="tel"' : '') + '><span class="grf-err"></span></label>';
        }).join('') +
        '<div class="grf-hp" aria-hidden="true"><input type="text" name="grf_x' + Math.random().toString(36).slice(2, 8) + '" tabindex="-1" autocomplete="new-password" data-lpignore="true" data-1p-ignore="" data-bwignore="" data-form-type="other" readonly onfocus="this.removeAttribute(\'readonly\')"></div>' +
        '<span class="grf-send-err" role="alert"></span>' +
        '<button type="submit" class="grf-btn grf-btn-teal grf-submit"><span class="grf-fill"></span><span class="grf-submit-l">Send my brief</span><span>→</span></button>' +
        '<span class="grf-small">Free and no obligation. We only use your details to prepare your quote.</span></form></div>';
    }
    E.body.innerHTML = h;
    bindBody(id, q);
  }
  function renderNav() {
    if (S.done) { E.nav.hidden = true; return; }
    E.nav.hidden = false;
    var i = cur(), id = flow()[i], q = D[id], showNext = q && (q.multi || !AUTO);
    E.nav.classList.toggle('is-final', !q);
    E.nav.innerHTML = '<button type="button" class="grf-back" aria-label="Back"' + (i === 0 ? ' disabled' : '') + '><span>←</span><span class="grf-tx">Back</span></button>' +
      (showNext ? '<button type="button" class="grf-btn grf-btn-navy grf-next" aria-label="Continue"' + (has(id) ? '' : ' disabled') + '><span class="grf-fill"></span><span class="grf-tx">Continue</span><span>→</span></button>' : '');
    E.nav.querySelector('.grf-back').onclick = function () { go(cur() - 1); };
    var nx = E.nav.querySelector('.grf-next');
    if (nx) nx.onclick = function () { if (!has(id) || S.busy) return; go(i + 1, function () { return has(id); }); };
  }
  function renderBrief() {
    var fl = flow(), i = cur(), keys = fl.filter(function (k) { return D[k]; });
    var sig = keys.join('|');
    if (E.rows.getAttribute('data-sig') !== sig) {
      E.rows.setAttribute('data-sig', sig);
      E.rows.innerHTML = keys.map(function (k, n) {
        return '<button type="button" class="grf-row" data-k="' + k + '"><span class="grf-row-k">' + p2(n + 1) + '&nbsp;&nbsp;' + esc(D[k].k) + '</span><span class="grf-row-e">Edit</span><span class="grf-row-v"></span></button>';
      }).join('');
      [].forEach.call(E.rows.children, function (b) {
        b.onclick = function () { var k = b.getAttribute('data-k'); if (!b.classList.contains('is-has') || b.classList.contains('is-cur')) return; go(flow().indexOf(k), null, true); };
      });
    }
    var done = 0;
    [].forEach.call(E.rows.children, function (b) {
      var k = b.getAttribute('data-k'), v = S.a[k], val = Array.isArray(v) ? v.join(', ') : (v || ''), hv = !!val, c = !S.done && fl[i] === k;
      if (hv) done++;
      b.querySelector('.grf-row-v').textContent = hv ? val : (c ? 'Choosing…' : '—');
      b.disabled = !hv || c;
      requestAnimationFrame(function () { b.classList.toggle('is-has', hv); b.classList.toggle('is-cur', c); });
    });
    E.bc.innerHTML = '<b>' + p2(done) + '</b>&nbsp;/&nbsp;' + p2(keys.length);
  }
  function renderAll() { renderTop(); renderBody(); renderNav(); renderBrief(); }

  /* ---------- behaviour ---------- */
  function enter() {
    if (RM) return;
    var el = E.body.firstElementChild; if (!el || !el.animate) return;
    var head = el.querySelector('.grf-head'), items = el.querySelectorAll('.grf-opt, .grf-field, .grf-submit');
    if (head) head.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: EASE, fill: 'backwards' });
    [].forEach.call(items, function (c, k) { c.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 40 + k * 35, easing: EASE, fill: 'backwards' }); });
    var r = E.root.getBoundingClientRect();
    if (r.top < 0) window.scrollTo({ top: window.scrollY + r.top - 100, behavior: 'smooth' });
  }
  function transition(apply) {
    if (S.busy) return; S.busy = true;
    var el = E.body.firstElementChild, anim = null;
    function run() {
      var ok = apply() !== false;
      if (ok) { renderAll(); enter(); trackStep(); } else if (anim) anim.cancel();
      S.busy = false;
    }
    if (el && el.animate && !RM) { anim = el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }], { duration: 200, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }); setTimeout(run, 200); }
    else run();
  }
  function go(t, guard) {
    clearTimeout(T);
    t = Math.max(0, Math.min(flow().length - 1, t));
    if (t === S.i && !S.done) return;
    transition(function () { if (guard && !guard()) return false; S.i = t; S.done = false; });
  }
  function bindBody(id, q) {
    var rs = E.body.querySelector('[data-restart]');
    if (rs) rs.onclick = function () { clearTimeout(T); transition(function () { reset(); }); };
    if (q) {
      [].forEach.call(E.body.querySelectorAll('.grf-opt'), function (btn) {
        btn.onclick = function () {
          if (S.busy) return;
          var v = btn.getAttribute('data-v');
          if (!started) { started = true; track('gym_form_start', {}); }
          if (q.multi) {
            var c = (S.a[id] || []).slice(), ix = c.indexOf(v);
            if (ix > -1) c.splice(ix, 1); else c.push(v);
            S.a[id] = c;
            track('gym_form_answer', { step_id: id, answer: c.join(', ') });
          } else {
            var changed = S.a[id] !== v; S.a[id] = v;
            if (changed) track('gym_form_answer', { step_id: id, answer: v });
            if (AUTO) { var at = S.i; clearTimeout(T); T = setTimeout(function () { if (S.i === at && !S.done && S.a[id]) go(at + 1); }, 260); }
          }
          [].forEach.call(E.body.querySelectorAll('.grf-opt'), function (b) {
            var bv = b.getAttribute('data-v'), on = q.multi ? S.a[id].indexOf(bv) > -1 : S.a[id] === bv;
            b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on);
          });
          renderTop(); renderNav(); renderBrief();
        };
      });
      return;
    }
    var form = E.body.querySelector('.grf-form'); if (!form) return;
    function fld(k) { return form.querySelector('.grf-field[data-k="' + k + '"]'); }
    function setErr(k, m) { var l = fld(k); if (!l) return; l.classList.toggle('has-err', !!m); l.querySelector('.grf-err').textContent = m || ''; }
    function okLabels() {
      var a = ukPhone(S.f.phone), b = ukPhone(S.f.phone2);
      fld('phone').querySelector('.grf-ok').textContent = a ? '✓ Valid' : '';
      fld('phone2').querySelector('.grf-ok').textContent = a && b && a === b ? '✓ Match' : '';
    }
    F.forEach(function (f) {
      var k = f[0], inp = fld(k).querySelector('input');
      inp.addEventListener('input', function () { S.f[k] = inp.value; setErr(k, ''); okLabels(); });
      if (k === 'phone' || k === 'phone2') {
        inp.addEventListener('blur', function () {
          if (!(S.f[k] || '').trim()) return;
          var d = ukPhone(S.f[k]);
          if (!d) return setErr(k, 'Enter a valid UK mobile or landline');
          S.f[k] = inp.value = fmtPhone(d);
          var o = ukPhone(S.f[k === 'phone' ? 'phone2' : 'phone']);
          if (o && o !== d && (k === 'phone2' || (S.f.phone2 || '').trim())) setErr('phone2', "Numbers don't match");
          else if (o === d) setErr('phone2', '');
          okLabels();
        });
      }
      if (k === 'phone2') {
        var block = function (e) { e.preventDefault(); setErr('phone2', 'Please type your number again'); };
        inp.addEventListener('paste', block); inp.addEventListener('drop', block);
        var wipe = function () { inp.value = ''; S.f.phone2 = ''; okLabels(); setErr('phone2', 'Please type your number again'); };
        inp.addEventListener('input', function (e) { if (!e.inputType || e.inputType === 'insertReplacementText' || e.inputType === 'insertFromPaste') wipe(); });
        inp.addEventListener('animationstart', function (e) { if (e.animationName === 'grfAutofill') wipe(); });
      }
    });
    okLabels();
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (S.sending || S.busy) return;
      var f = S.f, err = {};
      F.forEach(function (x) { if (!(f[x[0]] || '').trim()) err[x[0]] = 'Required'; });
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) err.email = 'Check this email address';
      if (f.phone && !ukPhone(f.phone)) err.phone = 'Enter a valid UK mobile or landline';
      if (f.phone2 && !err.phone && ukPhone(f.phone2) !== ukPhone(f.phone)) err.phone2 = "Numbers don't match";
      F.forEach(function (x) { setErr(x[0], err[x[0]]); });
      var first = F.filter(function (x) { return err[x[0]]; })[0];
      if (first) { fld(first[0]).querySelector('input').focus(); return; }
      var fl = flow(), miss = -1;
      for (var n = 0; n < fl.length; n++) if (D[fl[n]] && !has(fl[n])) { miss = n; break; }
      if (miss > -1) return go(miss);
      submit(form);
    });
  }
  function submit(form) {
    var a = S.a, f = S.f, d = ukPhone(f.phone), attr = {};
    try { attr = JSON.parse(sessionStorage.getItem('gr_attr') || '{}'); } catch (e) {}
    var h = a.help || [];
    var body = {
      first_name: f.first.trim(), last_name: f.last.trim(), email: f.email.trim(), phone: '+44' + d.slice(1), postcode: f.postcode.trim().toUpperCase(),
      gym_space: a.where || '', gym_users: a.who || '', gym_scope: h,
      gym_equipment_focus: h.indexOf('Equipment') > -1 ? (a.equip || '') : '',
      gym_flooring: h.indexOf('Flooring') > -1 ? (a.floor || '') : '',
      gym_mirrors: h.indexOf('Mirrors') > -1 ? (a.mirror || '') : '',
      gym_start: a.when || '',
      utm_source: attr.utm_source || '', utm_medium: attr.utm_medium || '', utm_campaign: attr.utm_campaign || '', gclid: attr.gclid || '',
      landing_page: attr.landing_page || location.pathname,
      hp: ((form.querySelector('.grf-hp input') || {}).value || '').replace(/^\s+|\s+$/g, ''), t: Date.now() - t0
    };
    var btn = form.querySelector('.grf-submit'), lab = form.querySelector('.grf-submit-l'), errEl = form.querySelector('.grf-send-err');
    S.sending = true; btn.disabled = true; lab.textContent = 'Sending…'; errEl.textContent = '';
    fetch(EP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'Failed'); }); })
      .then(function () {
        track('generate_lead', { gym_space: a.where });
        S.sending = false;
        transition(function () { S.done = true; });
      })
      .catch(function () {
        S.sending = false; btn.disabled = false; lab.textContent = 'Send my brief';
        errEl.textContent = "Sorry, that didn't send. Please try again, or call us on " + PHONE + '.';
      });
  }

  /* ---------- init ---------- */
  function init() {
    var root = document.getElementById('gym-form') || document.querySelector('[data-gym-form]');
    if (!root || root.getAttribute('data-grf-ready')) return;
    root.setAttribute('data-grf-ready', '1');
    if (!document.getElementById('grf-css')) { var st = document.createElement('style'); st.id = 'grf-css'; st.textContent = CSS; document.head.appendChild(st); }
    try {
      var q = new URLSearchParams(location.search), prev = JSON.parse(sessionStorage.getItem('gr_attr') || '{}');
      ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'].forEach(function (k) { if (q.get(k)) prev[k] = q.get(k); });
      if (!prev.landing_page) prev.landing_page = location.pathname;
      sessionStorage.setItem('gr_attr', JSON.stringify(prev));
    } catch (e) {}
    root.innerHTML = '<div class="grf"><div class="grf-main"><div class="grf-top"><div class="grf-meta"><span class="grf-meta-l"><span>Design your gym</span><span class="grf-muted">It only takes 2 minutes</span></span><span class="grf-count"></span></div><div class="grf-segs"></div></div><div class="grf-body"></div><div class="grf-nav"></div></div>' +
      '<aside class="grf-brief" aria-label="Your brief"><div class="grf-brief-in"><div class="grf-brief-h"><span>Your brief</span><span class="grf-brief-c"></span></div><div class="grf-brief-rows"></div></div></aside></div>';
    E = { root: root, count: root.querySelector('.grf-count'), segs: root.querySelector('.grf-segs'), body: root.querySelector('.grf-body'), nav: root.querySelector('.grf-nav'), rows: root.querySelector('.grf-brief-rows'), bc: root.querySelector('.grf-brief-c') };
    reset(); renderAll(); trackStep();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
