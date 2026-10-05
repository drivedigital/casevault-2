import { SectionHeading } from "@/components/ui";
import { BridgeControls } from "@/components/BridgeControls";
import { bridgeState } from "@/lib/bridges";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BridgesPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/docket-key"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ChevronLeft size={16} />
          <span>Back to Court Dockets</span>
        </Link>
      </div>

      <SectionHeading
        eyebrow="Docket-Key"
        title="Court & NotebookLM Bridge"
        description="Refresh court sources and send verified originals to their existing notebooks through the integrated bridge daemon. Challenges and expired sessions pause work safely."
      />

      <BridgeControls initialState={await bridgeState()} />
    </div>
  );
}
