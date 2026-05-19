// seed/insert-mext.sql を 1 INSERT 文 = 1 ファイルに分割する
// MCP execute_sql に投げやすくするため
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  const text = await readFile(resolve("seed/insert-mext.sql"), "utf8");
  // 各 INSERT 文は ; で終わる
  const stmts = text
    .split(/;\s*\n+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("INSERT") || s.startsWith("-- "));

  let n = 0;
  for (const s of stmts) {
    if (!s.startsWith("INSERT")) continue;
    n += 1;
    const idx = String(n).padStart(2, "0");
    await writeFile(resolve(`seed/sql-batch-${idx}.sql`), s + ";\n");
  }
  console.log(`✓ ${n} files written: seed/sql-batch-*.sql`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
