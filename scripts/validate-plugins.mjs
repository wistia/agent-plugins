#!/usr/bin/env node

// Validate official schemas plus repository-specific structure and frontmatter.
// Schema snapshots and their provenance live under schemas/.

import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const errors = [];

const schemaPaths = {
  cursorMarketplace: path.join(repoRoot, "schemas", "cursor", "marketplace.schema.json"),
  cursorPlugin: path.join(repoRoot, "schemas", "cursor", "plugin.schema.json"),
  agentPlugin: path.join(
    repoRoot,
    "schemas",
    "agent-plugins",
    "1.0.0",
    "plugin.schema.json"
  ),
  agentMcp: path.join(repoRoot, "schemas", "agent-plugins", "1.0.0", "mcp.schema.json"),
};

const pluginNamePattern = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const marketplaceNamePattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skillResourcePattern = /(?:\]\(|`)((?:\.\/)?(?:assets|references|scripts)\/[^\s)`#]+)(?:#[^\s)`]*)?(?:\)|`)/g;
const nonPortableSkillPatterns = [
  { pattern: /\/mnt\/(?:skills|user-data)\//, label: "Claude filesystem paths" },
  { pattern: /\bask_user_input_v\d+\b/, label: "Claude-specific input tools" },
  { pattern: /\btool_search\b/, label: "host-specific tool discovery" },
  { pattern: /\bpresent_files\b/, label: "Claude-specific file presentation" },
  { pattern: /\bvisualize:[a-z0-9_-]+\b/i, label: "host-specific visualize tools" },
];

function addError(message) {
  errors.push(message);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(targetPath, context) {
  try {
    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      addError(`${context} exists but is not a directory: ${targetPath}`);
      return false;
    }
    return true;
  } catch {
    addError(`${context} directory is missing: ${targetPath}`);
    return false;
  }
}

async function readJsonFile(filePath, context) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    addError(`${context} is missing: ${filePath}`);
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    addError(`${context} contains invalid JSON (${filePath}): ${error.message}`);
    return null;
  }
}

function formatSchemaError(error) {
  const location = error.instancePath || "/";
  if (error.keyword === "additionalProperties") {
    return `${location}: unsupported property "${error.params.additionalProperty}"`;
  }
  return `${location}: ${error.message}`;
}

function validateAgainstSchema(validate, document, filePath) {
  if (validate(document)) {
    return;
  }

  const relativeFile = path.relative(repoRoot, filePath);
  for (const error of validate.errors ?? []) {
    addError(`${relativeFile}: ${formatSchemaError(error)}`);
  }
}

async function loadSchemaValidators() {
  const schemas = {};
  for (const [name, schemaPath] of Object.entries(schemaPaths)) {
    const schema = await readJsonFile(schemaPath, `${name} schema`);
    if (!schema) {
      return null;
    }
    schemas[name] = schema;
  }

  try {
    const cursorAjv = new Ajv({ allErrors: true, strict: true });
    const agentPluginsAjv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(cursorAjv);
    addFormats(agentPluginsAjv);

    return {
      cursorMarketplace: cursorAjv.compile(schemas.cursorMarketplace),
      cursorPlugin: cursorAjv.compile(schemas.cursorPlugin),
      agentPlugin: agentPluginsAjv.compile(schemas.agentPlugin),
      agentMcp: agentPluginsAjv.compile(schemas.agentMcp),
    };
  } catch (error) {
    addError(`Could not compile vendored schemas: ${error.message}`);
    return null;
  }
}

function normalizeNewlines(content) {
  return content.replace(/\r\n/g, "\n");
}

function parseFrontmatter(content) {
  const normalized = normalizeNewlines(content);
  if (!normalized.startsWith("---\n")) {
    return null;
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex === -1) {
    return null;
  }

  const frontmatterBlock = normalized.slice(4, closingIndex);
  const fields = {};

  for (const line of frontmatterBlock.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();
    const matchingQuotes =
      rawValue.length >= 2 &&
      ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'")));
    const value = matchingQuotes ? rawValue.slice(1, -1) : rawValue;
    fields[key] = value;
  }

  return fields;
}

async function walkFiles(dirPath) {
  const files = [];
  const stack = [dirPath];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function isSafeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return true;
  }
  if (path.isAbsolute(value)) {
    return false;
  }
  const normalized = path.posix.normalize(value.replace(/\\/g, "/"));
  return !normalized.startsWith("../") && normalized !== "..";
}

function extractPathValues(value) {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractPathValues(entry));
  }

  if (value && typeof value === "object") {
    const candidates = [];
    if (typeof value.path === "string") {
      candidates.push(value.path);
    }
    if (typeof value.file === "string") {
      candidates.push(value.file);
    }
    return candidates;
  }

  return [];
}

async function validateReferencedPath(pluginDir, fieldName, pathValue, pluginName) {
  if (pathValue.startsWith("http://") || pathValue.startsWith("https://")) {
    return;
  }

  if (!isSafeRelativePath(pathValue)) {
    addError(
      `${pluginName}: field "${fieldName}" has invalid path "${pathValue}". Use a relative path without ".." or absolute prefixes.`
    );
    return;
  }

  const resolved = path.resolve(pluginDir, pathValue);
  const exists = await pathExists(resolved);
  if (!exists) {
    addError(`${pluginName}: field "${fieldName}" references missing path "${pathValue}".`);
  }
}

async function validateFrontmatterFile(filePath, componentName, requiredKeys, pluginName) {
  const content = await fs.readFile(filePath, "utf8");
  const parsed = parseFrontmatter(content);
  const relativeFile = path.relative(repoRoot, filePath);

  if (!parsed) {
    addError(`${pluginName}: ${componentName} file missing YAML frontmatter: ${relativeFile}`);
    return;
  }

  for (const key of requiredKeys) {
    if (!parsed[key] || parsed[key].length === 0) {
      addError(`${pluginName}: ${componentName} file missing "${key}" in frontmatter: ${relativeFile}`);
    }
  }
}

async function validateSkillFile(skillDir, pluginName) {
  const skillFile = path.join(skillDir, "SKILL.md");
  const relativeSkillDir = path.relative(repoRoot, skillDir);
  const skillDirName = path.basename(skillDir);

  if (!(await pathExists(skillFile))) {
    addError(`${pluginName}: skill directory is missing SKILL.md: ${relativeSkillDir}`);
    return;
  }

  const content = await fs.readFile(skillFile, "utf8");
  const parsed = parseFrontmatter(content);
  const relativeFile = path.relative(repoRoot, skillFile);

  if (!parsed) {
    addError(`${pluginName}: skill file missing YAML frontmatter: ${relativeFile}`);
    return;
  }

  for (const key of ["name", "description"]) {
    if (!parsed[key] || parsed[key].length === 0) {
      addError(`${pluginName}: skill file missing "${key}" in frontmatter: ${relativeFile}`);
    }
  }

  if (parsed.name) {
    if (!skillNamePattern.test(parsed.name) || parsed.name.length > 64) {
      addError(
        `${pluginName}: skill name must be lowercase kebab-case and at most 64 characters: ${relativeFile}`
      );
    }
    if (parsed.name !== skillDirName) {
      addError(
        `${pluginName}: skill name "${parsed.name}" must match directory "${skillDirName}": ${relativeFile}`
      );
    }
  }

  if (parsed.description && parsed.description.length > 1024) {
    addError(`${pluginName}: skill description exceeds 1024 characters: ${relativeFile}`);
  }

  const normalizedContent = normalizeNewlines(content);
  const lineCount = normalizedContent.endsWith("\n")
    ? normalizedContent.split("\n").length - 1
    : normalizedContent.split("\n").length;
  if (lineCount > 500) {
    addError(
      `${pluginName}: SKILL.md exceeds the repository's 500-line progressive-disclosure limit (${lineCount} lines): ${relativeFile}`
    );
  }

  for (const { pattern, label } of nonPortableSkillPatterns) {
    if (pattern.test(content)) {
      addError(`${pluginName}: skill uses ${label}: ${relativeFile}`);
    }
  }

  for (const match of content.matchAll(skillResourcePattern)) {
    const resourcePath = match[1].replace(/^\.\//, "");
    if (!isSafeRelativePath(resourcePath)) {
      addError(`${pluginName}: skill has an unsafe resource reference "${match[1]}": ${relativeFile}`);
      continue;
    }

    const resolved = path.resolve(skillDir, resourcePath);
    const skillRoot = `${path.resolve(skillDir)}${path.sep}`;
    if (!resolved.startsWith(skillRoot)) {
      addError(`${pluginName}: skill resource escapes its directory "${match[1]}": ${relativeFile}`);
      continue;
    }
    if (!(await pathExists(resolved))) {
      addError(`${pluginName}: skill references missing resource "${match[1]}": ${relativeFile}`);
    }
  }
}

async function validateComponentFrontmatter(pluginDir, pluginName) {
  const rulesDir = path.join(pluginDir, "rules");
  if (await pathExists(rulesDir)) {
    const files = await walkFiles(rulesDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".md" || ext === ".mdc" || ext === ".markdown") {
        await validateFrontmatterFile(file, "rule", ["description"], pluginName);
      }
    }
  }

  const skillsDir = path.join(pluginDir, "skills");
  if (await pathExists(skillsDir)) {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        await validateSkillFile(path.join(skillsDir, entry.name), pluginName);
      } else {
        addError(
          `${pluginName}: skills/ may contain only skill directories; found ${path.relative(repoRoot, path.join(skillsDir, entry.name))}`
        );
      }
    }
  }

  const agentsDir = path.join(pluginDir, "agents");
  if (await pathExists(agentsDir)) {
    const files = await walkFiles(agentsDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".md" || ext === ".mdc" || ext === ".markdown") {
        await validateFrontmatterFile(file, "agent", ["name", "description"], pluginName);
      }
    }
  }

  const commandsDir = path.join(pluginDir, "commands");
  if (await pathExists(commandsDir)) {
    const files = await walkFiles(commandsDir);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".md" || ext === ".mdc" || ext === ".markdown" || ext === ".txt") {
        await validateFrontmatterFile(file, "command", ["name", "description"], pluginName);
      }
    }
  }
}

function resolveMarketplaceSource(source, pluginRoot) {
  if (typeof source !== "string" || source.length === 0) {
    return null;
  }
  if (!pluginRoot) {
    return source;
  }
  const normalizedRoot = pluginRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  const normalizedSource = source.replace(/\\/g, "/");
  if (normalizedSource === normalizedRoot || normalizedSource.startsWith(`${normalizedRoot}/`)) {
    return normalizedSource;
  }
  return `${normalizedRoot}/${normalizedSource}`;
}

async function main() {
  const validators = await loadSchemaValidators();
  if (!validators) {
    summarizeAndExit();
    return;
  }

  const marketplacePath = path.join(repoRoot, ".cursor-plugin", "marketplace.json");
  const marketplace = await readJsonFile(marketplacePath, "Marketplace manifest");
  if (!marketplace) {
    summarizeAndExit();
    return;
  }
  validateAgainstSchema(validators.cursorMarketplace, marketplace, marketplacePath);

  if (typeof marketplace.name !== "string" || !marketplaceNamePattern.test(marketplace.name)) {
    addError(
      'Marketplace "name" must be lowercase kebab-case and start/end with an alphanumeric character.'
    );
  }

  if (!marketplace.owner || typeof marketplace.owner.name !== "string" || marketplace.owner.name.length === 0) {
    addError('Marketplace "owner.name" is required.');
  }

  if (!Array.isArray(marketplace.plugins) || marketplace.plugins.length === 0) {
    addError('Marketplace "plugins" must be a non-empty array.');
    summarizeAndExit();
    return;
  }

  const pluginRoot = marketplace.metadata?.pluginRoot;
  if (pluginRoot !== undefined) {
    if (typeof pluginRoot !== "string" || !isSafeRelativePath(pluginRoot)) {
      addError('Marketplace "metadata.pluginRoot" must be a safe relative path.');
    } else {
      const pluginRootAbs = path.join(repoRoot, pluginRoot);
      await ensureDirectory(pluginRootAbs, 'Marketplace "metadata.pluginRoot"');
    }
  }

  const seenNames = new Set();
  for (const [index, entry] of marketplace.plugins.entries()) {
    const label = `plugins[${index}]`;

    if (!entry || typeof entry !== "object") {
      addError(`${label} must be an object.`);
      continue;
    }

    if (typeof entry.name !== "string" || !pluginNamePattern.test(entry.name)) {
      addError(`${label}.name must be lowercase and use only alphanumerics, hyphens, and periods.`);
      continue;
    }

    if (seenNames.has(entry.name)) {
      addError(`Duplicate plugin name in marketplace manifest: "${entry.name}"`);
    }
    seenNames.add(entry.name);

    const sourcePath = resolveMarketplaceSource(entry.source, pluginRoot ?? "");
    if (!sourcePath) {
      addError(`${label}.source must be a string path.`);
      continue;
    }
    if (!isSafeRelativePath(sourcePath)) {
      addError(`${label}.source is not a safe relative path: "${sourcePath}"`);
      continue;
    }

    const pluginDir = path.join(repoRoot, sourcePath);
    const pluginDirExists = await ensureDirectory(pluginDir, `${label}.source`);
    if (!pluginDirExists) {
      continue;
    }

    const manifestPath = path.join(pluginDir, ".cursor-plugin", "plugin.json");
    const pluginManifest = await readJsonFile(manifestPath, `${entry.name} plugin manifest`);
    if (!pluginManifest) {
      continue;
    }
    validateAgainstSchema(validators.cursorPlugin, pluginManifest, manifestPath);

    if (typeof pluginManifest.name !== "string" || !pluginNamePattern.test(pluginManifest.name)) {
      addError(
        `${entry.name}: "name" in plugin.json must be lowercase and use only alphanumerics, hyphens, and periods.`
      );
    }

    if (pluginManifest.name && pluginManifest.name !== entry.name) {
      addError(
        `${entry.name}: marketplace entry name does not match plugin.json name ("${pluginManifest.name}").`
      );
    }

    const manifestFields = ["logo", "rules", "skills", "agents", "commands", "hooks", "mcpServers"];
    for (const field of manifestFields) {
      const values = extractPathValues(pluginManifest[field]);
      for (const value of values) {
        await validateReferencedPath(pluginDir, field, value, entry.name);
      }
    }

    await validateComponentFrontmatter(pluginDir, entry.name);

    const portablePluginPath = path.join(pluginDir, "plugin.json");
    const portablePlugin = await readJsonFile(
      portablePluginPath,
      `${entry.name} Agent Plugins manifest`
    );
    if (portablePlugin) {
      validateAgainstSchema(validators.agentPlugin, portablePlugin, portablePluginPath);
      if (portablePlugin.name !== entry.name) {
        addError(
          `${entry.name}: marketplace entry name does not match portable plugin.json name ("${portablePlugin.name}").`
        );
      }
    }

    const mcpPath = path.join(pluginDir, "mcp.json");
    const portableMcp = await readJsonFile(mcpPath, `${entry.name} Agent Plugins MCP manifest`);
    if (portableMcp) {
      validateAgainstSchema(validators.agentMcp, portableMcp, mcpPath);
    }
  }

  summarizeAndExit();
}

function summarizeAndExit() {
  if (errors.length > 0) {
    console.error("Validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Validation passed.");
}

await main();
