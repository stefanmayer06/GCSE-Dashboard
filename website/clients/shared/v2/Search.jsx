import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../resource-cache.js';
import { flattenTopics } from '../study.js';
const tools = [['Today’s plan','/'],['Exam practice and diagnostic','/practice'],['Topic map and lessons','/learn'],['Mistake notebook and saved reviews','/notebook'],['Weekly reflection','/summary'],['Paper results','/results'],['Tutor explanations','/chat'],['Profile, exam goals and appearance','/settings']];
export default function Search({ api, subject, userId }) {
  const [query, setQuery] = useState('');
  const { data, error, refresh } = useResource(`topics:${subject}:${userId}`, () => api.topics());
  const { data: texts } = useResource(subject === 'english' ? 'texts:english' : null, () => api.texts());
  const { data: personal } = useResource(`search-personal:${subject}:${userId}`, () => api.personal());
  const entries = [
    ...tools.map(([title,to]) => ({title,to,kind:'Study tool'})),
    ...flattenTopics(data, subject === 'english' ? 'sections' : 'strands').map(t => ({title:t.name, detail:t.blurb,to:`/learn/${t.id}`,kind:'Topic'})),
    ...(texts?.texts || []).map(t => ({title:t.title,detail:t.author,to:`/texts/${t.id}`,kind:'Source text'})),
    ...(personal?.mistakes || []).map(t => ({title:t.topicName,detail:t.prompt,to:'/notebook',kind:'Saved mistake'})),
  ];
  const matches = entries.filter(e => `${e.title} ${e.detail || ''} ${e.kind}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="page search-page"><header className="page-head"><div><h1>Follow your curiosity.</h1><p className="sub">Find a topic, source, saved mistake or study tool in this subject.</p></div></header><label className="studio-search"><span>What would you like to find?</span><input type="search" autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Try fractions, feedback or exam date…"/></label>{error && <p role="alert">Topics could not load. <button className="btn" onClick={refresh}>Retry topics</button></p>}<p className="sub" role="status">{matches.length} {matches.length === 1 ? 'result' : 'results'}</p><div className="search-results">{matches.slice(0,100).map((item,i)=><Link key={`${item.kind}:${item.to}:${i}`} to={item.to}><span><small>{item.kind}</small><strong>{item.title}</strong>{item.detail && <p>{item.detail}</p>}</span><span aria-hidden="true">→</span></Link>)}</div>{!matches.length && <div className="studio-empty"><h2>No match yet.</h2><p>Try a shorter phrase, or explore the topics in your course.</p><Link className="btn" to="/learn">Explore topics</Link></div>}</div>;
}
