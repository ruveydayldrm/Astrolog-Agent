// supabase/migrations/*.sql dosyalarını sırayla birleştirip supabase/setup.sql üretir
// (SQL Editor'e tek seferde yapıştırmak için).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "supabase/migrations";
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

let out =
  "-- Lyra · Tek seferlik kurulum betiği\n" +
  "-- Supabase Dashboard → SQL Editor → New query → bu dosyanın tamamını yapıştır → Run.\n" +
  "-- (supabase/migrations altındaki dosyaların sıralı birleşimidir; npm run db:bundle ile yeniden üretilir.)\n";
for (const f of files) out += `\n-- ============ ${f} ============\n${readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n")}`;

writeFileSync("supabase/setup.sql", out);
console.log(`supabase/setup.sql yazıldı (${files.length} migration).`);
