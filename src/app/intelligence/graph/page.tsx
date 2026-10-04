import { SectionHeading } from "@/components/ui";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";

export default function GraphPage() {
  return <div className="space-y-5"><SectionHeading eyebrow="Intelligence" title="Knowledge Graph" description="Reserved for a future view of your case relationships." /><KnowledgeGraph /></div>;
}
