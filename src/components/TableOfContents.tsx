import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDoc } from '../context/DocContext';
import InlineText from './blocks/InlineText';

interface TocItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  scrollContainer: React.RefObject<HTMLElement | null>;
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ scrollContainer }) => {
  const { currentPage } = useDoc();
  const [activeId, setActiveId] = useState<string>('');
  const tocItems: TocItem[] = useMemo(() => currentPage.sections.flatMap((section) => {
    const heading = section.blocks.find((block) => block.type === 'heading');
    return heading ? [{ id: section.id, title: heading.text }] : [];
  }), [currentPage.sections]);

  useEffect(() => {
    const root = scrollContainer.current;
    if (!root) return;

    const sections = tocItems.map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => !!section && root.contains(section));
    let frame = 0;
    const updateActive = () => {
      const readingLine = root.getBoundingClientRect().top + parseFloat(getComputedStyle(root).paddingTop) + 1;
      let id = sections[0]?.id ?? '';
      for (const section of sections) {
        if (section.getBoundingClientRect().top > readingLine) break;
        id = section.id;
      }
      setActiveId(id);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateActive);
    };
    scheduleUpdate();
    root.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [tocItems, scrollContainer]);

  return (
    <aside className="toc" aria-label="On this page">
      <h4>On this page</h4>
      <ul id="toc-list">
        {tocItems.map((item) => (
          <li key={item.id}>
            <Link
              to={{ hash: `#${encodeURIComponent(item.id)}` }}
              state={{ scrollBehavior: 'smooth' }}
              className={activeId === item.id ? 'active' : ''}
              aria-current={activeId === item.id ? 'location' : undefined}
            >
              <InlineText text={item.title} links={false} />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default TableOfContents;
