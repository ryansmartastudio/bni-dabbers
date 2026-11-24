import { PipelineBoard } from "@/components/crm/pipeline-board";
import { listPipeline } from "@/lib/crm/visitors";
import { requireChapterMember } from "@/lib/member-access";

export const dynamic = "force-dynamic";

const SCOPES = ["all", "mine", "unclaimed"] as const;
type Scope = (typeof SCOPES)[number];

function readScope(value: string | string[] | undefined): Scope {
  return SCOPES.includes(value as Scope) ? (value as Scope) : "all";
}

export default async function CrmPage({ searchParams }: PageProps<"/crm">) {
  // The chapter comes from the member, so the query below cannot be widened
  // by anything in the URL.
  const { member } = await requireChapterMember();
  const { scope, view } = await searchParams;
  const visitors = await listPipeline(member.chapterId);

  return (
    <PipelineBoard
      visitors={visitors}
      meId={member.id}
      meName={`${member.firstName} ${member.lastName}`.trim()}
      scope={readScope(scope)}
      // The map is the default: it answers "which seats are still empty"
      // at a glance, which is the question the pipeline exists for. The board
      // is a click away and stays in the URL once chosen.
      view={view === "board" ? "board" : "map"}
    />
  );
}
