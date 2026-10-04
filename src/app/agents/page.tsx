import {AgentWorkspace} from '@/components/AgentWorkspace';
import {readAgents} from '@/lib/agent-workspace';
import {SectionHeading} from '@/components/ui';
export const dynamic='force-dynamic';
export default async function AgentsPage(){return <div className="space-y-6"><SectionHeading eyebrow="Intelligence" title="AI Agents" description="Configure the agents available for document processing."/><AgentWorkspace initialAgents={await readAgents()}/></div>;}
