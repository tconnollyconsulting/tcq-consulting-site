/* Browser-local phrase matching. No network requests or query storage. */
(function () {
  'use strict';
  const apps = typeof TCQ_APPS !== 'undefined' ? TCQ_APPS : require('./finder-catalog.js');
  const normalize = s => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function closeWord(a, b) {
    if (a === b) return true;
    if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
    let i=0,j=0,errors=0;
    while(i<a.length && j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++errors>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
    return errors+(a.length-i)+(b.length-j)<=1;
  }
  function recommend(raw) {
    const q=normalize(String(raw).slice(0,500)), words=q.split(' ');
    if (!q) return {kind:'empty',message:'Describe a task or choose an example.'};
    if (/\b(android|windows|booking|book a restaurant|password manager|password vault|vehicle lookup|identify owners|smart meter|turn by turn|medical diagnosis|stock trading)\b/.test(q)) return {kind:'none',message:'We do not have a TCQ app for that request. This portfolio focuses on iPhone apps. Browse the app pages for the tasks each one supports.'};
    if (/\b(auto|automatically|schedule|scheduled)\b/.test(q) && /\b(post|posts|publish|publishing)\b/.test(q)) return {kind:'none',message:'No TCQ app automatically publishes social posts. Verdial helps prepare content that you review and share yourself.',alternative:'verdial'};
    const scored=apps.map(app=>{
      let score=0;
      const phrases=[...app.terms,normalize(app.name),normalize(app.id)];
      for (const term of phrases){const t=normalize(term),pattern=new RegExp('(?:^| )'+t+'(?: |$)');
        if(new RegExp('(?:not|no|without|except) '+t+'(?: |$)').test(q))continue;
        if(pattern.test(q))score+=t.includes(' ')?4:2;
        else if(!t.includes(' ')&&words.some(w=>closeWord(w,t)))score+=1;
      }
      return {app,score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.app.id.localeCompare(b.app.id));
    if (!scored.length && /\b(memories|memory|remember moments|remember things)\b/.test(q)) return {kind:'clarify',message:'Would you like to revisit written memories on a date, or keep a journal of places and experiences?',choices:[{label:'Memories with yearly reminders',query:'Annual memory reminders'},{label:'Places, meals and experiences',query:'Journal restaurants and experiences'}]};
    if (!scored.length) return {kind:'none',message:'I could not find a clear match in the TCQ portfolio. Try describing the task more specifically, or browse all 15 apps.'};
    return {kind:'matches',apps:scored.slice(0,3).map(x=>x.app),message:'Based on your description, '+(scored.length>1?'these apps may help.':'this app may help.')};
  }
  if(typeof module!=='undefined')module.exports={recommend};
  if(typeof document==='undefined')return;
  const form=document.getElementById('finder-form'),input=document.getElementById('need'),status=document.getElementById('result-status'),results=document.getElementById('results');
  function el(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function card(app,alternative=false){
    const article=el('article',null,'result');const icon=el('img');icon.src=app.icon;icon.alt='';article.append(icon,el('h2',app.name),el('p',alternative?'Related option, with a different capability: '+app.problemSolved:app.problemSolved));
    const list=el('ul');app.features.slice(0,3).forEach(f=>list.append(el('li',f)));article.append(list,el('p',app.limitation,'note'));
    const price=Number(app.usDownloadPrice)===0?'Free download':'$'+app.usDownloadPrice+' download';article.append(el('p',price+' · US App Store, checked October 5, 2026. '+app.purchaseNote+' Prices can change.','note'));
    const links=el('nav',null,'result-links');links.setAttribute('aria-label',app.name+' links');
    for(const [label,url] of [['Explore '+app.name,app.sourcePage],['View on the App Store',app.appStoreUrl]]){const a=el('a',label);a.href=url;links.append(a);}article.append(links);return article;
  }
  function run(){
    const result=recommend(input.value);results.replaceChildren();status.textContent=result.message;
    if(result.kind==='matches')result.apps.forEach(a=>results.append(card(a)));
    if(result.alternative)results.append(card(apps.find(a=>a.id===result.alternative),true));
    if(result.kind==='clarify'){const choices=el('div',null,'choices');result.choices.forEach(c=>{const b=el('button',c.label);b.type='button';b.addEventListener('click',()=>{input.value=c.query;run();});choices.append(b);});results.append(choices);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();run();});
  document.querySelectorAll('[data-query]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.query;run();}));
})();
