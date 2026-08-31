import { scanMonorepo } from "@/lib/scanner";
import { ExplorerClient } from "@/components/ExplorerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Dynamically scan packages on each request
  const scanResult = scanMonorepo(true);

  return <ExplorerClient initialData={scanResult} />;
}
