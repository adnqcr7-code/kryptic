import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_ORIGINS = new Set(['owner', 'agent', 'system']);
const MAX_SKILL_BYTES = 64 * 1024;

function skillRoot(workspace) {
  return path.join(workspace.workspaceRoot, '.kryptic', 'skills');
}

function safeSkillName(name) {
  if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9._-]{1,63}$/.test(name)) throw new Error('Skill name must be 2-64 lowercase letters, numbers, dots, underscores, or hyphens.');
  return name;
}

export async function promoteSkill(workspace, { name, description, instructions, origin = 'agent', evidence }) {
  safeSkillName(name);
  if (!ALLOWED_ORIGINS.has(origin)) throw new Error(`Invalid skill origin: ${origin}`);
  if (evidence?.status !== 'verified') throw new Error('Skill promotion requires verified evidence.');
  if (typeof description !== 'string' || !description.trim()) throw new Error('Skill description must be non-empty.');
  if (typeof instructions !== 'string' || !instructions.trim()) throw new Error('Skill instructions must be non-empty.');
  const content = `---\nname: ${name}\ndescription: ${description.trim().slice(0, 1000)}\norigin: ${origin}\nevidence: verified\nverifiedAt: ${new Date().toISOString()}\n---\n\n${instructions.trim()}\n`;
  if (Buffer.byteLength(content) > MAX_SKILL_BYTES) throw new Error('Skill is too large.');
  const root = skillRoot(workspace);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(path.join(root, `${name}.md`), content, { encoding: 'utf8', flag: 'wx' }).catch(async (error) => {
    if (error.code !== 'EEXIST') throw error;
    await fs.writeFile(path.join(root, `${name}.md`), content, 'utf8');
  });
  return { name, path: path.join('.kryptic', 'skills', `${name}.md`), origin, evidence: 'verified' };
}

export async function listSkills(workspace) {
  let names;
  try { names = await fs.readdir(skillRoot(workspace)); } catch { return []; }
  return (await Promise.all(names.filter((name) => name.endsWith('.md')).sort().map(async (file) => ({
    name: file.slice(0, -3),
    path: path.join('.kryptic', 'skills', file),
    content: (await fs.readFile(path.join(skillRoot(workspace), file), 'utf8')).slice(0, MAX_SKILL_BYTES)
  }))));
}

export async function searchSkills(workspace, query, limit = 5) {
  const terms = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  return (await listSkills(workspace))
    .map((skill) => ({ skill, score: terms.reduce((score, term) => score + (skill.content.toLowerCase().includes(term) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, limit)
    .map((item) => item.skill);
}
