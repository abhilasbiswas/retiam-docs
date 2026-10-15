import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TUTORIAL_PAGES } from '../../data/docPages';
import { filterTutorials } from '../../lib/navigation';
import InlineText from './InlineText';

export default function TutorialIndexBlock() {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [group, setGroup] = useState('');
  const pages = filterTutorials(TUTORIAL_PAGES, query, difficulty, group);
  return <div className="tutorial-index">
    <div className="tutorial-filters">
      <label>Find a tutorial<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Entity, shader, chart…" /></label>
      <label>Difficulty<select value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
      <label>Topic<select value={group} onChange={event => setGroup(event.target.value)}><option value="">All topics</option>{[...new Set(TUTORIAL_PAGES.map(page => page.group))].map(title => <option key={title}>{title}</option>)}</select></label>
    </div>
    <p role="status">{pages.length} tutorial{pages.length === 1 ? '' : 's'}</p>
    {!pages.length && <p>Try another topic or clear the filters.</p>}
    <div className="tutorial-list">{pages.map(page => <article key={page.id} className="tutorial-card">
      <p className="tutorial-meta">{page.group} · {page.difficulty} · About {page.estimatedMinutes} minutes</p>
      <h3><Link to={`/${page.id}`}>{page.title}</Link></h3>
      <p><InlineText text={page.summary || ''} /></p>
      <p><strong>Build: </strong><InlineText text={page.outcome || ''} /></p>
      <Link to={`/${page.id}`} className="learning-start">Open tutorial <span aria-hidden="true">→</span></Link>
    </article>)}</div>
  </div>;
}
