/* Ion Productions — site-wide search
   Self-contained. Requires search-index.js (defines window.SITE_INDEX) loaded first.
   Injects a floating search button + overlay on any page it's included on. */
(function(){
  "use strict";
  var INDEX = window.SITE_INDEX || [];

  // ---------- styles ----------
  var css = ''
   + '.ss-fab{position:fixed;right:20px;bottom:20px;z-index:9998;width:54px;height:54px;border-radius:50%;'
   + 'border:1.5px solid rgba(58,166,255,.7);background:rgba(6,9,18,.85);color:#dbe9ff;cursor:pointer;'
   + 'display:flex;align-items:center;justify-content:center;font-size:22px;backdrop-filter:blur(6px);'
   + 'box-shadow:0 0 18px rgba(58,166,255,.45);transition:transform .15s,box-shadow .3s}'
   + '.ss-fab:hover{transform:translateY(-2px) scale(1.05);box-shadow:0 0 30px rgba(58,166,255,.8)}'
   + '.ss-overlay{position:fixed;inset:0;z-index:9999;display:none;background:rgba(2,4,10,.72);'
   + 'backdrop-filter:blur(8px);padding:10vh 16px 16px;overflow:hidden}'
   + '.ss-overlay.open{display:block}'
   + '.ss-box{max-width:640px;margin:0 auto;background:linear-gradient(150deg,rgba(12,20,38,.96),rgba(6,7,15,.96));'
   + 'border:1px solid rgba(159,216,230,.25);border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.6)}'
   + '.ss-inwrap{display:flex;align-items:center;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(159,216,230,.14)}'
   + '.ss-inwrap .ss-mag{font-size:18px;opacity:.8;flex:none}'
   + '.ss-input{flex:1;background:none;border:none;outline:none;color:#e8eef5;font-size:18px;'
   + "font-family:'Space Grotesk',system-ui,sans-serif}"
   + '.ss-input::placeholder{color:#8893a6}'
   + '.ss-esc{font-size:11px;color:#8893a6;border:1px solid rgba(159,216,230,.25);border-radius:6px;padding:3px 7px;flex:none}'
   + '.ss-results{max-height:56vh;overflow-y:auto;padding:6px}'
   + '.ss-item{display:flex;align-items:center;gap:13px;padding:11px 13px;border-radius:11px;cursor:pointer;'
   + 'color:inherit;text-decoration:none}'
   + '.ss-item:hover,.ss-item.sel{background:rgba(58,166,255,.14)}'
   + '.ss-ic{font-size:20px;flex:none;width:26px;text-align:center}'
   + '.ss-tx{flex:1;min-width:0}'
   + '.ss-tt{font-size:15px;color:#e8eef5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '.ss-tt mark{background:rgba(58,166,255,.32);color:#fff;border-radius:3px;padding:0 1px}'
   + '.ss-sb{font-size:12.5px;color:#8893a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '.ss-badge{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#3aa6ff;opacity:.8;flex:none}'
   + '.ss-empty{padding:26px 18px;text-align:center;color:#8893a6;font-size:14px}'
   + '@media(max-width:520px){.ss-fab{width:48px;height:48px;font-size:19px;right:14px;bottom:14px}.ss-esc{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- elements ----------
  var fab = document.createElement('button');
  fab.className = 'ss-fab'; fab.setAttribute('aria-label','Search the site'); fab.title='Search (press /)';
  fab.innerHTML = '🔍';

  var overlay = document.createElement('div');
  overlay.className = 'ss-overlay'; overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true'); overlay.setAttribute('aria-label','Site search');
  overlay.innerHTML =
     '<div class="ss-box">'
   +   '<div class="ss-inwrap"><span class="ss-mag">🔍</span>'
   +     '<input class="ss-input" type="search" autocomplete="off" spellcheck="false" '
   +       'placeholder="Search music, design, art, pages…" aria-label="Search query">'
   +     '<span class="ss-esc">Esc</span></div>'
   +   '<div class="ss-results" id="ssResults"></div>'
   + '</div>';

  document.body.appendChild(fab);
  document.body.appendChild(overlay);

  var input = overlay.querySelector('.ss-input');
  var results = overlay.querySelector('#ssResults');
  var sel = -1, current = [];

  // ---------- search ----------
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function highlight(text, terms){
    var out = esc(text);
    terms.forEach(function(t){
      if(!t) return;
      var re = new RegExp('('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');
      out = out.replace(re,'<mark>$1</mark>');
    });
    return out;
  }
  function score(e, terms){
    var t=(e.t||'').toLowerCase(), d=(e.d||'').toLowerCase(), k=(e.k||'').toLowerCase();
    var s=0;
    for(var i=0;i<terms.length;i++){
      var term=terms[i]; if(!term) continue;
      var inT=t.indexOf(term), inD=d.indexOf(term), inK=k.indexOf(term);
      if(inT<0 && inD<0 && inK<0) return -1;            // every term must match somewhere
      if(inT===0) s+=12; else if(inT>0) s+=7;
      if(inD>=0) s+=3;
      if(inK>=0) s+=1;
    }
    return s;
  }
  function run(q){
    q=q.trim().toLowerCase();
    if(!q){ current=[]; render(''); return; }
    var terms=q.split(/\s+/);
    var scored=[];
    for(var i=0;i<INDEX.length;i++){
      var sc=score(INDEX[i],terms);
      if(sc>=0) scored.push({e:INDEX[i],s:sc});
    }
    scored.sort(function(a,b){return b.s-a.s;});
    current=scored.slice(0,30).map(function(x){return x.e;});
    render(q);
  }
  function render(q){
    var terms = q?q.split(/\s+/):[];
    if(!q){ results.innerHTML='<div class="ss-empty">Type to search across the whole site.</div>'; sel=-1; return; }
    if(!current.length){ results.innerHTML='<div class="ss-empty">No matches for "'+esc(q)+'".</div>'; sel=-1; return; }
    var html='';
    current.forEach(function(e,i){
      html+='<a class="ss-item" href="'+e.u+'" data-i="'+i+'">'
        +'<span class="ss-ic">'+(e.ic||'•')+'</span>'
        +'<span class="ss-tx"><div class="ss-tt">'+highlight(e.t,terms)+'</div>'
        +'<div class="ss-sb">'+esc(e.d||'')+'</div></span>'
        +'<span class="ss-badge">'+esc((e.k||'').split('·')[0].trim())+'</span></a>';
    });
    results.innerHTML=html;
    sel=0; markSel();
  }
  function markSel(){
    var items=results.querySelectorAll('.ss-item');
    items.forEach(function(el,i){ el.classList.toggle('sel',i===sel); });
    if(sel>=0 && items[sel]) items[sel].scrollIntoView({block:'nearest'});
  }

  // ---------- open / close ----------
  function open(){ overlay.classList.add('open'); input.value=''; run(''); setTimeout(function(){input.focus();},30); }
  function close(){ overlay.classList.remove('open'); }
  function isOpen(){ return overlay.classList.contains('open'); }

  fab.addEventListener('click', open);
  overlay.addEventListener('click', function(e){ if(e.target===overlay) close(); });
  input.addEventListener('input', function(){ run(input.value); });

  input.addEventListener('keydown', function(e){
    var items=results.querySelectorAll('.ss-item');
    if(e.key==='ArrowDown'){ e.preventDefault(); if(items.length){ sel=(sel+1)%items.length; markSel(); } }
    else if(e.key==='ArrowUp'){ e.preventDefault(); if(items.length){ sel=(sel-1+items.length)%items.length; markSel(); } }
    else if(e.key==='Enter'){ if(sel>=0 && items[sel]){ window.location.href=items[sel].getAttribute('href'); } }
    else if(e.key==='Escape'){ close(); }
  });

  document.addEventListener('keydown', function(e){
    var tag=(e.target.tagName||'').toLowerCase();
    var typing = tag==='input'||tag==='textarea'||e.target.isContentEditable;
    if((e.key==='/'|| ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k')) && !typing && !isOpen()){
      e.preventDefault(); open();
    } else if(e.key==='Escape' && isOpen()){ close(); }
  });
})();
