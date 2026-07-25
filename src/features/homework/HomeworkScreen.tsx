import NavLink from "@/components/ui/NavLink";
import { AppContainer, BottomNav, Section, BOTTOM_NAV_CLEARANCE } from "@/components/layout";

import UnreadBadge from "./qa/UnreadBadge";

export interface HomeworkTopicSummary {
  id: string;
  title: string;
  description: string | null;
  /** Who assigned this topic — shown per card since a student can be in more than one group. */
  teacherUsername: string;
  /** How many learning modules (vocabulary, grammar) the topic has. */
  totalModules: number;
  /** How many of those modules the student has passed. */
  passedModules: number;
  /** Unread Q&A messages in this topic's thread — shows a badge when > 0. */
  unreadCount: number;
}

export interface HomeworkScreenProps {
  /** Names of every group the student belongs to — almost always just one, shown once up top. */
  groupNames: string[];
  topics: HomeworkTopicSummary[];
}

function TopicCard({ topic }: { topic: HomeworkTopicSummary }) {
  const done = topic.totalModules > 0 && topic.passedModules >= topic.totalModules;
  const empty = topic.totalModules === 0;
  return (
    <NavLink
      href={`/homework/${topic.id}`}
      className="block rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-4 transition-colors hover:border-white/20"
    >
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/40">
        By {topic.teacherUsername}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className="truncate text-body-strong text-white">{topic.title}</p>
        <UnreadBadge count={topic.unreadCount} />
      </div>
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
          {empty
            ? "Nothing to study yet"
            : done
              ? "Completed"
              : `${topic.passedModules}/${topic.totalModules} passed`}
        </span>
        {!empty && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {done ? "Review" : topic.passedModules > 0 ? "Continue" : "Start"}
          </span>
        )}
      </div>
    </NavLink>
  );
}

/** Homework list: every lesson topic across every group the student belongs to. */
export default function HomeworkScreen({ groupNames, topics }: HomeworkScreenProps) {
  return (
    <AppContainer>
      <Section pt="lg" pb="sm">
        <h1 className="text-h2 font-black text-white">Homework</h1>
        {groupNames.length > 0 && (
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-cyan">
            {groupNames.join(" · ")}
          </p>
        )}
        <p className="mt-0.5 text-small text-white/50">Practice what your teacher assigned.</p>
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
