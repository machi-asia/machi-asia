// Dynamic TypeScript prop analyzer.
//
// Instead of a hand-maintained registry, this module parses each package's
// TypeScript sources and extracts every "enumerable" prop — a prop whose type
// is a finite union of string/number literals (e.g. `variant?: 'a' | 'b'`) —
// resolving named type aliases (single-line, multi-line, and cross-file) so the
// explorer can render a dropdown of every possible value for any component in
// any package.

export interface PropDef {
  /** The prop name passed to the component, e.g. "variant". */
  prop: string;
  /** Human-readable label shown on the dropdown. */
  label: string;
  /** All possible literal values for the prop. */
  values: string[];
  /** Initial/default value for the dropdown. */
  default?: string;
}

/** A source file with a relative path (used for stable ordering). */
export interface SourceUnit {
  relativePath: string;
  source: string;
}

/** Find the end index of the brace block that starts at `startIndex`. */
function braceEnd(body: string, startIndex: number): number {
  let depth = 0;
  let i = startIndex;
  while (i < body.length) {
    const ch = body[i];
    if (ch === "/" && body[i + 1] === "/") {
      const nl = body.indexOf("\n", i);
      i = nl === -1 ? body.length : nl + 1;
      continue;
    }
    if (ch === "/" && body[i + 1] === "*") {
      const end = body.indexOf("*/", i + 2);
      i = end === -1 ? body.length : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      const q = ch;
      let j = i + 1;
      while (j < body.length) {
        if (body[j] === "\\") j += 2;
        else if (body[j] === q) {
          j++;
          break;
        } else j++;
      }
      i = j;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return body.length;
}

/**
 * Extract literal string/number values from a union RHS body. Returns null if
 * the body contains a bare open type (`string`, `number`, `...`) that makes it
 * unbounded / non-enumerable.
 */
function literalValues(body: string): string[] | null {
  if (/(?<![A-Za-z0-9_$])(?:string|number|boolean|object|any|unknown|symbol|bigint|ReactNode)(?![A-Za-z0-9_$])/.test(body)) {
    return null;
  }
  const tokenRe = /'([^']*)'|"([^"]*)"|(\d+)/g;
  const values: string[] = [];
  let m: RegExpExecArray | null;
  let saw = false;
  while ((m = tokenRe.exec(body)) !== null) {
    const val = m[1] ?? m[2] ?? m[3];
    if (val === undefined) continue;
    saw = true;
    values.push(val);
  }
  if (!saw) return null;
  return Array.from(new Set(values));
}

/** Resolve an alias name to its literal values (with cycle guard). */
function resolveAlias(name: string, aliases: Map<string, string[]>): string[] | null {
  const v = aliases.get(name);
  return v && v.length ? v : null;
}

/**
 * Given an extracted type expression and the alias table, determine whether it
 * is a finite literal union and return its values, or null if not enumerable.
 */
function resolveTypeExpr(typeExpr: string, aliases: Map<string, string[]>): string[] | null {
  let expr = typeExpr.trim().replace(/\s+/g, " ");

  // Strip pure modifiers / nullable wrappers that don't add values.
  const stripOptional = (s: string) =>
    s
      .replace(/\s*\|\s*(?:undefined|null|false)\b/gi, "")
      .replace(/^\s*(?:undefined|null)\s*\|\s*/i, "")
      .replace(/\b(?:undefined|null|false)\b/gi, "")
      .trim();

  // 0. Boolean props are enumerable: true | false.
  if (/^boolean(\s*\|\s*undefined|\s*\|\s*null)?$/i.test(expr)) {
    return ["true", "false"];
  }

  // 1. Array-of-union: `SomeAlias[]` (optionally `| false`). Resolve element.
  const arrayMatch = /^([A-Za-z_$][\w$]*)\s*\[\]\s*(\|\s*(?:false|true))?$/.exec(expr);
  if (arrayMatch) {
    const elem = resolveAlias(arrayMatch[1], aliases);
    if (elem) return elem;
  }

  // 2. Direct single alias reference.
  if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
    const v = resolveAlias(expr, aliases);
    if (v) return v;
  }

  // 3. Inline literal union (string or numeric literals, with optional
  //    flag/leading-`|` continuation forms).
  expr = stripOptional(expr).replace(/^\s*\|\s*/, "");
  const values = literalValues(expr);
  if (values) return values;

  return null;
}

/**
 * Collect all named literal-union type aliases across every source in a
 * package, keyed by alias name. Cross-file aliases (e.g. `AuthMode` imported
 * from `./types`) resolve because we scan every `.ts`/`.tsx` file.
 */
function collectAliases(units: SourceUnit[]): Map<string, string[]> {
  const aliases = new Map<string, string[]>();
  const aliasRefs = new Map<string, string>();

  for (const { source } of units) {
    const headerRe = /(?:^|\n)\s*(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
    let header: RegExpExecArray | null;
    while ((header = headerRe.exec(source)) !== null) {
      const name = header[1];
      const start = headerRe.lastIndex;
      const rest = source.slice(start);
      const lines = rest.split(/\r?\n/);
      const bodyLines: string[] = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (
          trimmed === "" ||
          /^(export\s+)?type\s/.test(trimmed) ||
          /^(export\s+)?interface\s/.test(trimmed) ||
          /^(export\s+)?(const|let|var|function|class|enum)\s/.test(trimmed) ||
          /^export\s*\{/.test(trimmed) ||
          /^import\s/.test(trimmed) ||
          /^export\s+default/.test(trimmed)
        ) {
          break;
        }
        bodyLines.push(trimmed);
        if (trimmed.endsWith(";") || trimmed.endsWith("}")) break;
      }
      if (bodyLines.length === 0) continue;
      const body = bodyLines.join("\n").replace(/;\s*$/, "");

      const values = literalValues(body);
      if (values) {
        aliases.set(name, values);
      } else {
        // Possibly an alias-of-alias (`type B = A`). Record for later.
        const ref = /^\s*([A-Za-z_$][\w$]*)\s*$/.exec(body);
        if (ref) aliasRefs.set(name, ref[1]);
      }
    }
  }

  // Resolve alias-of-alias references (may chain).
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, target] of aliasRefs) {
      if (!aliases.has(name)) {
        const targetVals = resolveAlias(target, aliases);
        if (targetVals) {
          aliases.set(name, targetVals);
          changed = true;
        }
      }
    }
  }

  return aliases;
}

/** Extract enumerable props declared inside a props interface body. */
function propsFromInterface(body: string, aliases: Map<string, string[]>): PropDef[] {
  const props: PropDef[] = [];
  const propRe = /^\s*([A-Za-z_$][\w$]*)\??\s*:\s*([^;\n]+?)\s*;?\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(body)) !== null) {
    const propName = m[1];
    const typeExpr = m[2];
    const values = resolveTypeExpr(typeExpr, aliases);
    if (values && values.length) {
      props.push({
        prop: propName,
        label: propName,
        values,
        default: values[0],
      });
    }
  }
  return props;
}

/**
 * Analyze every component file in a package and return a map of
 * `relativePath -> enumerable PropDef[]`.
 *
 * @param units All `.ts`/`.tsx` source units in the package (used to resolve
 *              named aliases, including cross-file ones).
 */
export function analyzePackage(units: SourceUnit[]): Map<string, PropDef[]> {
  const result = new Map<string, PropDef[]>();
  const aliases = collectAliases(units);

  for (const { relativePath, source } of units) {
    if (!relativePath.endsWith(".tsx")) {
      result.set(relativePath, []);
      continue;
    }
    // The props that belong to this component are those declared on interfaces
    // whose name begins with the file's base name (e.g. Table.tsx -> TableProps,
    // Toast.tsx -> ToastOptions). This keeps internal sub-component props (e.g.
    // Table's SortIndicatorProps) from leaking into this component's dropdown.
    const baseName = relativePath.split("/").pop()!.replace(/\.tsx$/, "");
    const found: PropDef[] = [];
    const seenProps = new Set<string>();

    const headerRe = /(?:^|\n)\s*(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/g;
    let header: RegExpExecArray | null;
    while ((header = headerRe.exec(source)) !== null) {
      const interfaceName = header[1];
      if (!/\w*(?:Props|Options)\w*$/.test(interfaceName)) continue;
      if (!interfaceName.startsWith(baseName)) continue;

      const openBrace = source.indexOf("{", headerRe.lastIndex);
      if (openBrace === -1) continue;
      const end = braceEnd(source, openBrace);
      const body = source.slice(openBrace + 1, end);

      for (const def of propsFromInterface(body, aliases)) {
        if (!seenProps.has(def.prop)) {
          seenProps.add(def.prop);
          found.push(def);
        }
      }
    }

    result.set(relativePath, found);
  }

  return result;
}
