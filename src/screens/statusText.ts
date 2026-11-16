import type { Mark } from '../data/types';
import type { Status } from '../logic/status';
import { timeOf } from '../logic/time';
import { t } from '../text/en';

/** The words for a status. `live`: a student not ticked yet is not "absent" while the class runs. */
export function statusText(status: Status, mark: Mark | undefined, live: boolean): string[] {
  const s = t.register.status;
  const out: string[] = [];
  if (status.kind === 'onTime') out.push(s.onTime);
  else if (status.kind === 'late') out.push(s.late(status.minutesLate ?? 0));
  else if (status.kind === 'presentTimeUnknown') out.push(s.timeUnknown);
  else if (status.kind === 'present') out.push(s.here);
  else if (status.kind === 'absent' && status.explicit) out.push(s.absent);
  else if (status.kind === 'absent' && !live) out.push(s.notTicked);
  if (status.excused) out.push(s.excused);
  if (mark?.leftAt) out.push(s.left(timeOf(mark.leftAt)));
  else if (status.leftEarly) out.push(s.leftEarly);
  return out;
}
