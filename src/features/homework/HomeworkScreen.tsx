import NavLink from "@/components/ui/NavLink";
import { AppContainer, BottomNav, Section, BOTTOM_NAV_CLEARANCE } from "@/components/layout";

export interface HomeworkTopicSummary {
  id: string;
  title: string;
  description: string | null;
  groupName: string;
  totalTasks: number;
  completedTasks: number;
}

export interface HomeworkScreenProps {
  topics: HomeworkTopicSummary[];
}

function TopicCard({ topic }: { topic: HomeworkTopicSummary }) {
  const done = topic.totalTasks > 0 && topic.completedTasks >= topic.totalTasks;
  return (
    <NavLink
      href={`/homework/${topic.id}`}
      className="block rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 transition-colors hover:border-white/20"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
        {topic.groupName}
      </p>
      <p className="mt-1 truncate text-body-strong text-white">{topic.title}</p>
      {topic.description && (
        <p className="mt-0.5 line-clamp-2 text-small text-white/50">{topic.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={[
            "text-xs font-bold uppercase tracking-wide",
            done ? "text-lime-green" : "text-cyan",
          ].join(" ")}
        >
          {done ? "Completed" : `${topic.completedTasks}/${topic.totalTasks} done`}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
          {done ? "Practice Again" : topic.completedTasks > 0 ? "Continue" : "Start"}
        </span>
      </div>
    </NavLink>
  );
}

/** Homework list: every lesson topic across every group the child belongs to. */
export default function HomeworkScreen({ topics }: HomeworkScreenProps) {
  return (
    <AppContainer>
      <Section pt="lg" pb="sm">
        <h1 className="text-h2 font-black text-white">Homework</h1>
        <p className="text-small text-white/50">Practice what your teacher assigned.</p>
      </Section>

      <Section py="sm" className={BOTTOM_NAV_CLEARANCE}>
        {topics.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-10 text-center text-small text-white/60">
            No homework yet. Check back once your teacher assigns some.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {topics.map((topic) => (
              <li key={topic.id}>
                <TopicCard topic={topic} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <BottomNav showHomework />
    </AppContainer>
  );
}
