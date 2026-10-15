import type { ApiEntry } from '../data/references';

const categories = ['Overview', 'Construction', 'Transforms', 'Appearance', 'Animation and updates', 'Hierarchy and lifecycle', 'Interaction', 'Geometry and bounds', 'Properties', 'Methods'];

export function apiCategory(entry: ApiEntry) {
  if (!entry.qualified.includes('.')) return 'Overview';
  if (entry.kind === 'constructor' || entry.name === 'constructor') return 'Construction';
  const name = entry.name.toLowerCase();
  if (/^(destroy|dispose|reset|restart|clone|copy|addchild|removechild|addcomponent|removecomponent|removecomponents|removecomponentbytype|oninit|ondestroy|setparent|parent|children|components)/.test(name)) return 'Hierarchy and lifecycle';
  if (/^(move|shift|rotate|scale|translate|transform|setposition|setrotation|setscale|setpivot|setanchor|getposition|getrotation|getscale|getpivot|getanchor|position|rotation|pivot|anchor|offset|matrix|worldmatrix|localmatrix)/.test(name)) return 'Transforms';
  if (/(opacity|stroke|fill|color|paint|material|gradient|shadow)/.test(name)) return 'Appearance';
  if (/^(animate|animator|play|pause|resume|stop|wait|seek|update|onupdate|always|time|duration|delay|rate|lagratio|applyoptions)/.test(name)) return 'Animation and updates';
  if (/(event|pointer|click|drag|hover|raycast|hittest)/.test(name)) return 'Interaction';
  if (/(bounds|aabb|geometry|vertices|contour|boundary|length|sample|pointat|tangent)/.test(name)) return 'Geometry and bounds';
  return ['property', 'getter', 'setter', 'accessor', 'enum-member'].includes(entry.kind) ? 'Properties' : 'Methods';
}

export function groupApiEntries(entries: ApiEntry[]) {
  const owners = new Set(entries.filter(entry => ['class', 'interface', 'enum'].includes(entry.kind)).map(entry => entry.qualified));
  const families = new Map<string, ApiEntry[]>();
  for (const entry of entries) {
    const dot = entry.qualified.lastIndexOf('.');
    const owner = dot >= 0 ? entry.qualified.slice(0, dot) : owners.has(entry.qualified) ? entry.qualified : '';
    const members = families.get(owner) || [];
    members.push(entry);
    families.set(owner, members);
  }
  return [...families].map(([owner, members]) => ({
    owner,
    categories: (owner && members.length >= 8 ? categories : ['Members']).map(title => ({
      title,
      entries: members.filter(entry => title === 'Members' || apiCategory(entry) === title),
    })).filter(category => category.entries.length),
  }));
}

export function matchesApiEntry(entry: ApiEntry, query: string, includeInternal: boolean) {
  if (!includeInternal && entry.visibility !== 'public') return false;
  const parameters = (entry.overloads || [{ parameters: entry.parameters }]).flatMap(overload => overload.parameters);
  const text = [entry.qualified, entry.description, ...entry.signatures, ...entry.notes,
    ...parameters.flatMap(parameter => [parameter.name, parameter.description])].join(' ').toLowerCase();
  return text.includes(query.trim().toLowerCase());
}
