import { backfillEntitlementGrants } from "@/modules/entitlement/backfill-grants";

async function main() {
  const result = await backfillEntitlementGrants();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
