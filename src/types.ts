// ─── Block Types ─────────────────────────────────────────────────────────────

export interface ParagraphBlock {
  type: 'paragraph';
  text: string; // supports markdown
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'danger' | 'success' | 'tip';
  title?: string;
  content: string;
}

export interface TableCell {
  text: string;
  type?: 'code' | 'type' | 'text'; // Optional cell type override
}

export interface TableRow {
  id?: string;
  cells: TableCell[] | string[]; // support legacy string[] for ease of migration
}

export interface TableColumnDef {
  label: string;
  width?: string; // e.g. "18%", "auto"
}

export interface TableBlock {
  type: 'table';
  columns: TableColumnDef[] | string[]; // support legacy string[]
  rows: TableRow[];
}

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ListItem {
  text: string; // supports inline Markdown
  children?: (string | ListItem)[];
  ordered?: boolean; // numbering for this item's children
  start?: number; // first number for this item's children
}

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  start?: number;
  items: (string | ListItem)[];
}

export interface ImageBlock {
  type: 'image';
  url: string;
  alt: string;
  caption?: string;
  width?: string;
  height?: string;
  align?: 'left' | 'center' | 'right';
}

export interface VideoBlock {
  type: 'video';
  url: string;
  caption?: string;
  width?: string;
  height?: string;
  align?: 'left' | 'center' | 'right';
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

export interface MathBlock {
  type: 'math';
  tex: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
}

export interface TabsBlock {
  type: 'tabs';
  tabs: {
    label: string;
    blocks: ContentBlock[];
  }[];
}

export interface LinkBlock {
  type: 'link';
  url: string; // e.g. "https://github.com/..." or "/getting-started#section-api"
  title: string;
  description?: string;
  icon?: 'github' | 'link' | 'article' | string;
}

export interface PlaygroundBlock {
  type: 'playground';
  id?: string;
  url?: string;
  filename: string;
  code: string;
}

/** Renders a canonical repository module with its source, guidance and live scene when available. */
export interface ExampleBlock {
  type: 'example';
  example: string;
  title?: string;
}

export interface ApiReferenceBlock {
  type: 'api-reference';
  source: string;
}

/** Source-derived inheritance; root is a type name, API ID or source:type. */
export interface ClassHierarchyBlock {
  type: 'class-hierarchy';
  root: string;
  depth?: 1 | 2 | 3 | 'all';
  browse?: boolean;
}

export interface DetailsBlock {
  type: 'details';
  title: string;
  blocks: ContentBlock[];
}

export interface TreeNode {
  label: string;
  description?: string;
  children?: TreeNode[];
}

export interface TreeBlock {
  type: 'tree';
  variant?: 'horizontal' | 'vertical' | 'folder';
  nodes: TreeNode[];
}

export interface TutorialIndexBlock { type: 'tutorial-index'; }

export type ContentBlock = 
  | HeadingBlock
  | ParagraphBlock
  | CalloutBlock
  | ListBlock
  | TableBlock
  | ImageBlock
  | VideoBlock
  | MathBlock
  | CodeBlock
  | TabsBlock
  | LinkBlock
  | PlaygroundBlock
  | ExampleBlock
  | ApiReferenceBlock
  | ClassHierarchyBlock
  | DetailsBlock
  | TreeBlock
  | TutorialIndexBlock;

// ─── Section & Page ──────────────────────────────────────────────────────────

export interface ContentSection {
  id: string;
  // title is now handled by heading blocks inside the section
  blocks: ContentBlock[];
}

export interface ContentPage {
  id: string;
  group: string;
  title: string;
  summary?: string;
  prerequisites?: string[]; // Inline Markdown links to earlier guides.
  outcome?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes?: number;
  // playgroundCode and playgroundFilename are moved to PlaygroundBlock
  sections: ContentSection[];
}

export interface DocsConfig {
  cdnUrl: string;
  services?: {
    msedgeEndpoint?: string;
  };
}

export interface DocsContent {
  $schema?: string;
  config?: DocsConfig;
  pages: ContentPage[];
}

export type DocPageMetadata = Pick<ContentPage, 'id' | 'title' | 'group' | 'summary' | 'prerequisites' | 'outcome' | 'difficulty' | 'estimatedMinutes'>;

export interface NavigationGroup {
  title: string;
  kind?: 'guide' | 'tutorial' | 'reference';
  pages: string[];
}

export interface SearchRecord {
  pageId: string;
  sectionId: string;
  title: string;
  group: string;
  heading: string;
  snippet: string;
  type: 'page' | 'section' | 'api' | 'example';
  category?: NavigationGroup['kind'];
  tutorial?: boolean;
}

// ─── Aliases kept for backward compat with context / sidebar ─────────────────
export type DocPage = ContentPage;
export type DocSection = ContentSection;

export type Theme = 'dark' | 'light';
