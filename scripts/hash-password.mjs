// Usage: npm run hash-password -- "your-password"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH (or a company's
// password_hash column) in Supabase.
import bcrypt from "bcryptjs";

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: npm run hash-password -- "your-password"');
  process.exit(1);
}

const hash = await bcrypt.hash(plain, 12);
console.log(hash);
console.log(
  "\nWhen pasting into .env.local, escape every \"$\" as \"\\$\" — Next.js expands " +
    "$VAR syntax in .env files and will otherwise mangle this hash:\n" +
    hash.replace(/\$/g, "\\$")
);
