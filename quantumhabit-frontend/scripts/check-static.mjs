import * as fs from "fs";
import * as path from "path";

const prohibitedPatterns = [
  /getServerSideProps/,
  /getStaticProps/,
  /getInitialProps/,
  /server-only/,
  /next\/headers/,
  /cookies\(\)/,
  /route\.ts$/,
  /route\.js$/,
  /api\/.*\.ts$/,
  /api\/.*\.js$/,
];

const dynamicRoutePattern = /\[.*\]/;

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const errors = [];

  for (const pattern of prohibitedPatterns) {
    if (pattern.test(content)) {
      errors.push(`Found prohibited pattern: ${pattern} in ${filePath}`);
    }
  }

  // Check dynamic routes for generateStaticParams
  // Note: Client components ("use client") cannot export generateStaticParams
  // So we allow dynamic routes without generateStaticParams if they are client components
  const dir = path.dirname(filePath);
  const dirName = path.basename(dir);
  const isClientComponent = content.includes('"use client"') || content.includes("'use client'");
  if (dynamicRoutePattern.test(dirName)) {
    if (!isClientComponent && !content.includes("generateStaticParams")) {
      errors.push(
        `Dynamic route ${filePath} must export generateStaticParams (or use "use client")`
      );
    }
    // Check if client component has generateStaticParams (not allowed)
    // Use a more specific pattern to check for actual function export, not just mentions in comments
    const generateStaticParamsPattern = /export\s+(async\s+)?function\s+generateStaticParams|export\s*{\s*generateStaticParams|generateStaticParams\s*[:=]/;
    if (isClientComponent && generateStaticParamsPattern.test(content)) {
      errors.push(
        `Client component ${filePath} cannot export generateStaticParams. Remove generateStaticParams or make it a server component.`
      );
    }
  }

  return errors;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes("node_modules") && !filePath.includes(".next")) {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js") || file.endsWith(".jsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

const appDir = path.resolve("./app");
const componentsDir = path.resolve("./components");
const hooksDir = path.resolve("./hooks");

let allErrors = [];

if (fs.existsSync(appDir)) {
  const files = walkDir(appDir);
  files.forEach((file) => {
    const errors = checkFile(file);
    allErrors = allErrors.concat(errors);
  });
}

if (fs.existsSync(componentsDir)) {
  const files = walkDir(componentsDir);
  files.forEach((file) => {
    const errors = checkFile(file);
    allErrors = allErrors.concat(errors);
  });
}

if (fs.existsSync(hooksDir)) {
  const files = walkDir(hooksDir);
  files.forEach((file) => {
    const errors = checkFile(file);
    allErrors = allErrors.concat(errors);
  });
}

if (allErrors.length > 0) {
  console.error("❌ Static export check failed:\n");
  allErrors.forEach((error) => console.error(`  ${error}`));
  process.exit(1);
} else {
  console.log("✅ Static export check passed!");
}
