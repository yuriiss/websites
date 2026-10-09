import { FilterGrid } from './FilterGrid';
import { ARTICLE_CATEGORIES, ARTICLES } from '@/lib/site';

export function ArticleGrid() {
  return (
    <FilterGrid
      label="Filter articles"
      categories={ARTICLE_CATEGORIES}
      items={ARTICLES.map((a) => ({
        key: a.slug,
        cat: a.cat,
        node: (
          <a className="glass" href={`/blog-post/${a.slug}/`}>
            <span className="tag">{a.cat}</span>
            <h3 className="h3">{a.title}</h3>
            <p>{a.excerpt}</p>
            <div className="meta-row">
              <span>Maritime.Studio Team</span>
              <span>{a.date}</span>
            </div>
          </a>
        ),
      }))}
    />
  );
}
