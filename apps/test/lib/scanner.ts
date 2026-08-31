import fs from "fs";
import path from "path";
import { analyzePackage, PropDef, SourceUnit } from "./analyzer";

export interface ComponentDocs {
  description?: string;
  requiresAuth?: boolean;
  requiresProviders?: string[];
  requiresEnv?: string[];
  apiEndpoints?: string[];
  dependencies?: string[];
  usage?: string;
  notes?: string[];
}

export interface PackageDocs {
  summary?: string;
  requiresEnv?: string[];
  requiredRoutes?: string[];
  requiresProviders?: string[];
  assets?: string[];
}

export interface ComponentsManifest {
  package?: string;
  packageDocs?: PackageDocs;
  components?: Record<string, ComponentDocs>;
}

export interface ComponentFile {
  id: string;
  packageKey: string;
  packageName: string;
  packageDescription?: string;
  packageVersion?: string;
  relativePath: string;
  fileName: string;
  componentName: string;
  category: "Core Component" | "Test Suite" | "Page / View" | "Modal / Dialog" | "Provider / Gate";
  isTest: boolean;
  isPlayground: boolean;
  sizeBytes: number;
  lineCount: number;
  lastModified: string;
  exports: string[];
  imports: string[];
  sourceCode?: string;
  docs?: ComponentDocs | null;
  packageDocs?: PackageDocs | null;
  /** Enumerable (literal-union) props scraped from the component's types. */
  enumerableProps?: PropDef[];
}

export interface PackageGroup {
  packageKey: string;
  packageName: string;
  packageDescription?: string;
  packageVersion?: string;
  components: ComponentFile[];
  counts: {
    total: number;
    components: number;
    tests: number;
    pages: number;
  };
}

export interface MonorepoScanResult {
  packages: PackageGroup[];
  allComponents: ComponentFile[];
  stats: {
    totalPackages: number;
    totalTsxFiles: number;
    totalComponents: number;
    totalTests: number;
    totalPages: number;
    scannedAt: string;
  };
}

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".turbo",
  ".next",
  ".git",
  "coverage",
  ".swc",
  "build",
  "out",
  ".cache",
]);

/**
 * Dynamically locate the monorepo's packages directory
 */
export function getPackagesDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), "packages"),
    path.resolve(process.cwd(), "../../packages"),
    path.resolve(__dirname, "../../../packages"),
    path.resolve(__dirname, "../../../../packages"),
    path.resolve(process.cwd(), "../packages"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      return candidate;
    }
  }

  // Fallback to relative packages path
  return path.resolve(process.cwd(), "packages");
}

/**
 * Extract exported names and imports from TypeScript source
 */
function parseSourceMeta(source: string) {
  const exportMatches = new Set<string>();
  const importMatches = new Set<string>();

  // Extract exports: export function X, export const X, export default X, export class X, export { X }
  const namedExportRegex = /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_$]+)/g;
  let match: RegExpExecArray | null;
  while ((match = namedExportRegex.exec(source)) !== null) {
    if (match[1]) exportMatches.add(match[1]);
  }

  const exportListRegex = /export\s+\{([^}]+)\}/g;
  while ((match = exportListRegex.exec(source)) !== null) {
    if (match[1]) {
      match[1].split(",").forEach((item) => {
        const cleaned = item.trim().split(/\s+as\s+/)[0]?.trim();
        if (cleaned) exportMatches.add(cleaned);
      });
    }
  }

  if (/export\s+default/g.test(source)) {
    exportMatches.add("default");
  }

  // Extract imports
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(source)) !== null) {
    if (match[1]) importMatches.add(match[1]);
  }

  return {
    exports: Array.from(exportMatches),
    imports: Array.from(importMatches),
  };
}

/**
 * Load the machine-readable component manifest (component-docs.json) for a
 * package, if present.
 */
function loadComponentsManifest(pkgPath: string): ComponentsManifest | null {
  const manifestPath = path.join(pkgPath, "component-docs.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ComponentsManifest;
  } catch {
    return null;
  }
}

/**
 * Match a scanned file against the manifest's component keys. Tries the file
 * name (exact key) first, then any exported symbol, then a case-insensitive
 * name comparison so e.g. "usage-bar.tsx" maps to "UsageBar".
 */
function matchComponentDocs(
  componentName: string,
  exportsList: string[],
  manifest: ComponentsManifest | null
): ComponentDocs | null {
  if (!manifest?.components) return null;
  const exact = manifest.components[componentName];
  if (exact) return exact;

  for (const exported of exportsList) {
    const exact = manifest.components[exported];
    if (exact) return exact;
    const match = Object.entries(manifest.components).find(
      ([key]) => key.toLowerCase() === exported.toLowerCase()
    );
    if (match) return match[1];
  }

  const byName = Object.entries(manifest.components).find(
    ([key]) => key.toLowerCase() === componentName.toLowerCase()
  );
  return byName ? byName[1] : null;
}
/**
 * Next.js app-router framework files whose component name comes from their
 * parent folder (e.g. `foo/page.tsx` shows up as "foo"), since the file name
 * itself is a reserved framework name.
 */
const FRAMEWORK_FILES = new Set(["page", "layout", "loading", "error", "not-found", "template", "route"]);

/** Whether a scanned file is a test/spec file that should be excluded. */
function isTestFile(fileName: string, relativePath: string): boolean {
  return (
    /\.(test|spec)\.tsx$/i.test(fileName) ||
    /\.(test|spec)\.ts$/i.test(fileName) ||
    /(^|\/)__tests__\//i.test(relativePath)
  );
}

/**
 * Whether a file is a framework view-model that should not appear as a
 * component: any layout.tsx, or a page.tsx that lives in a Next app dir
 * (app/page.tsx), since those are structural files rather than components.
 */
function isExcludedViewModel(fileName: string, relativePath: string): boolean {
  if (fileName === "layout.tsx") return true;
  if (/\/app\/page\.tsx$/i.test(relativePath)) return true;
  return false;
}

/** Map a file to its display component name (folder name for framework files). */
function resolveComponentName(fileName: string, parentFolder: string): string {
  const base = fileName.replace(/\.tsx$/, "").replace(/\.ts$/, "");
  if (FRAMEWORK_FILES.has(base)) return parentFolder;
  return base;
}

/** Categorize a component file. */
function resolveCategory(
  fileName: string,
  relativePath: string,
  isTest: boolean,
  isPlayground: boolean
): ComponentFile["category"] {
  if (isTest) return "Test Suite";
  if (isPlayground || fileName === "page.tsx" || fileName === "layout.tsx") return "Page / View";
  if (fileName.endsWith("Modal.tsx") || fileName.endsWith("Dialog.tsx")) return "Modal / Dialog";
  if (fileName.endsWith("Provider.tsx") || fileName.endsWith("Providers.tsx") || fileName.endsWith("gate.tsx"))
    return "Provider / Gate";
  return "Core Component";
}

/**
 * Recursively find all .tsx files within a directory
 */
function findTsxFiles(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".env") continue;
    if (IGNORED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findTsxFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Collect every `.ts` / `.tsx` source unit in a package. This includes plain
 * `.ts` type files so named literal-union aliases (e.g. `AuthMode` in
 * `Auth/types.ts`) can be resolved across files.
 */
function collectPackageUnits(pkgPath: string): SourceUnit[] {
  const units: SourceUnit[] = [];
  const walk = (dir: string) => {
    let entries: import("fs").Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        try {
          const source = fs.readFileSync(fullPath, "utf8");
          const relativePath = path.relative(pkgPath, fullPath).replace(/\\/g, "/");
          units.push({ relativePath, source });
        } catch {
          // ignore read error
        }
      }
    }
  };
  walk(pkgPath);
  return units;
}

/**
 * Scan all packages in packages/* dynamically
 */
export function scanMonorepo(includeSource = false): MonorepoScanResult {
  const packagesDir = getPackagesDirectory();

  if (!fs.existsSync(packagesDir)) {
    return {
      packages: [],
      allComponents: [],
      stats: {
        totalPackages: 0,
        totalTsxFiles: 0,
        totalComponents: 0,
        totalTests: 0,
        totalPages: 0,
        scannedAt: new Date().toISOString(),
      },
    };
  }

  const packageDirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !IGNORED_DIRS.has(entry.name) && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const packageGroups: PackageGroup[] = [];
  const allComponents: ComponentFile[] = [];

  for (const pkgKey of packageDirs) {
    const pkgPath = path.join(packagesDir, pkgKey);
    let pkgJson: { name?: string; description?: string; version?: string } = {};

    const pkgJsonPath = path.join(pkgPath, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      try {
        pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      } catch {
        // ignore parse error
      }
    }

    const packageName = pkgJson.name || `@machi-asia/${pkgKey}`;
    const tsxFiles = findTsxFiles(pkgPath, pkgPath);
    const manifest = loadComponentsManifest(pkgPath);
    const components: ComponentFile[] = [];

    // Build the per-package enumerable-prop index (resolves literal-union
    // props from the package's TypeScript types, across .ts/.tsx files).
    const propIndex = analyzePackage(collectPackageUnits(pkgPath));

    for (const fullFilePath of tsxFiles) {
      const relativePath = path.relative(pkgPath, fullFilePath).replace(/\\/g, "/");
      const fileName = path.basename(fullFilePath);

      const isTest = isTestFile(fileName, relativePath);
      if (isTest) continue; // exclude test/spec files entirely
      if (isExcludedViewModel(fileName, relativePath)) continue; // exclude layout.tsx / app/page.tsx

      const parentFolder = path.basename(path.dirname(fullFilePath));
      const componentName = resolveComponentName(fileName, parentFolder);

      const isPlayground = relativePath.includes("playground/");

      const category = resolveCategory(fileName, relativePath, isTest, isPlayground);

      let source = "";
      let stats = { size: 0, mtime: new Date() };

      try {
        stats = fs.statSync(fullFilePath);
        source = fs.readFileSync(fullFilePath, "utf8");
      } catch {
        // ignore read error
      }

      const { exports, imports } = parseSourceMeta(source);
      const lineCount = source ? source.split(/\r\n|\r|\n/).length : 0;
      const id = `${pkgKey}::${relativePath}`;

      const componentObj: ComponentFile = {
        id,
        packageKey: pkgKey,
        packageName,
        packageDescription: pkgJson.description,
        packageVersion: pkgJson.version,
        relativePath,
        fileName,
        componentName,
        category,
        isTest,
        isPlayground,
        sizeBytes: stats.size,
        lineCount,
        lastModified: stats.mtime.toISOString(),
        exports,
        imports,
        sourceCode: includeSource ? source : undefined,
        docs: matchComponentDocs(componentName, exports, manifest),
        packageDocs: manifest?.packageDocs ?? null,
        enumerableProps: propIndex.get(relativePath),
      };

      components.push(componentObj);
      allComponents.push(componentObj);
    }

    // Sort components logically: core components first, then modals, providers, pages, tests
    components.sort((a, b) => {
      if (a.isTest !== b.isTest) return a.isTest ? 1 : -1;
      return a.relativePath.localeCompare(b.relativePath);
    });

    const testCount = components.filter((c) => c.isTest).length;
    const pageCount = components.filter((c) => c.isPlayground || c.category === "Page / View").length;
    const coreCount = components.length - testCount - pageCount;

    packageGroups.push({
      packageKey: pkgKey,
      packageName,
      packageDescription: pkgJson.description,
      packageVersion: pkgJson.version,
      components,
      counts: {
        total: components.length,
        components: coreCount,
        tests: testCount,
        pages: pageCount,
      },
    });
  }

  const totalTsx = allComponents.length;
  const totalTests = allComponents.filter((c) => c.isTest).length;
  const totalPages = allComponents.filter((c) => c.isPlayground || c.category === "Page / View").length;
  const totalComponents = totalTsx - totalTests - totalPages;

  return {
    packages: packageGroups,
    allComponents,
    stats: {
      totalPackages: packageGroups.length,
      totalTsxFiles: totalTsx,
      totalComponents,
      totalTests,
      totalPages,
      scannedAt: new Date().toISOString(),
    },
  };
}

/**
 * Fetch a specific component by its ID with full source code
 */
export function getComponentById(id: string): ComponentFile | null {
  const [pkgKey, ...pathParts] = id.split("::");
  if (!pkgKey || pathParts.length === 0) return null;

  const relativePath = pathParts.join("::");
  const packagesDir = getPackagesDirectory();
  const pkgPath = path.join(packagesDir, pkgKey);
  const fullPath = path.join(pkgPath, ...relativePath.split("/"));

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return null;
  }

  const manifest = loadComponentsManifest(pkgPath);

  const pkgJsonPath = path.join(packagesDir, pkgKey, "package.json");
  let pkgJson: { name?: string; description?: string; version?: string } = {};
  if (fs.existsSync(pkgJsonPath)) {
    try {
      pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
    } catch {
      // ignore
    }
  }

  const source = fs.readFileSync(fullPath, "utf8");
  const stats = fs.statSync(fullPath);
  const fileName = path.basename(fullPath);
  if (isExcludedViewModel(fileName, relativePath)) return null; // layout.tsx / app/page.tsx are not components
  const parentFolder = path.basename(path.dirname(fullPath));
  const componentName = resolveComponentName(fileName, parentFolder);

  const isTest = isTestFile(fileName, relativePath);

  const isPlayground = relativePath.includes("playground/");

  const category = resolveCategory(fileName, relativePath, isTest, isPlayground);

  const { exports, imports } = parseSourceMeta(source);
  const relativePathKey = relativePath.replace(/\\/g, "/");
  const enumerableProps = analyzePackage(collectPackageUnits(pkgPath)).get(relativePathKey);

  return {
    id,
    packageKey: pkgKey,
    packageName: pkgJson.name || `@machi-asia/${pkgKey}`,
    packageDescription: pkgJson.description,
    packageVersion: pkgJson.version,
    relativePath,
    fileName,
    componentName,
    category,
    isTest,
    isPlayground,
    sizeBytes: stats.size,
    lineCount: source.split(/\r\n|\r|\n/).length,
    lastModified: stats.mtime.toISOString(),
    exports,
    imports,
    sourceCode: source,
    docs: matchComponentDocs(componentName, exports, manifest),
    packageDocs: manifest?.packageDocs ?? null,
    enumerableProps,
  };
}
