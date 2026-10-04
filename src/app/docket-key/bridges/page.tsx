import { SectionHeading } from "@/components/ui";
import { BridgeControls } from "@/components/BridgeControls";
import { bridgeState } from "@/lib/bridges";
export const dynamic = "force-dynamic";
export default async function BridgesPage() { return <div className="space-y-6"><SectionHeading eyebrow="Docket-Key" title="Court & NotebookLM" description="Refresh court sources and send verified originals to their existing notebooks through your local bridge." /><BridgeControls initialState={await bridgeState()} /></div>; }
