export const documentStatusStyles: Record<string, string> = {
  pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
  processing: "bg-sky-50 text-sky-700 ring-sky-200",
  indexed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  flagged: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const matterStatusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  hidden: "bg-amber-50 text-amber-700 ring-amber-200",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  pending: "bg-sky-50 text-sky-700 ring-sky-200",
};

export const docketEntryStatusStyles: Record<string, string> = {
  pending_review: "bg-amber-50 text-amber-700 ring-amber-200",
  indexed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  verified: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const proposalStatusStyles: Record<string, string> = {
  proposed: "bg-amber-50 text-amber-700 ring-amber-200",
  accepted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const severityStyles: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  medium: "bg-amber-50 text-amber-700 ring-amber-200",
  high: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const deadlineStatusStyles: Record<string, string> = {
  upcoming: "bg-sky-50 text-sky-700 ring-sky-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  missed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const taskStatusStyles: Record<string, string> = {
  open: "bg-slate-100 text-slate-600 ring-slate-200",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-200",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export const polarityStyles: Record<string, string> = {
  supporting: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  adverse: "bg-rose-50 text-rose-700 ring-rose-200",
  context: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const connectorStatusStyles: Record<string, string> = {
  connected: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  disconnected: "bg-slate-100 text-slate-500 ring-slate-200",
  syncing: "bg-sky-50 text-sky-700 ring-sky-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const tagTypeStyles: Record<string, string> = {
  matter: "bg-violet-50 text-violet-700 ring-violet-200",
  party: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  concept: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
};

export const sourceTypeLabels: Record<string, string> = {
  docket_filing: "Docket Filing",
  drive: "Google Drive",
  upload: "Manual Upload",
  email: "Email",
};

export const contactTypeLabels: Record<string, string> = {
  individual: "Individual",
  organization: "Organization",
  law_firm: "Law Firm",
  court: "Court",
};
