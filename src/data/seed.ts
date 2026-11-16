import type { Do, Initiative, Planning, SeedItem, Waymark } from '../types';
import { addDays, today } from '../lib/dates';

/** The author's own season. Dates are relative to the day the demo is (re)set. */
export function seedPlanning(): Planning {
  const t = today();

  const initiatives: Initiative[] = [
    {
      id: 'i1',
      number: 1,
      lane: 'Mess',
      name: 'Set Your House in Order',
      degree: 3,
      status: 'active',
      vision: 'A clear house and workspace where I can think, pray and work. Put away childish things.',
      youAreHere: 'Kitchen and living room are clear. The garage and the office are still piled up.',
      finishedWhen: 'Every room has a place for everything, and I can find what I need without digging.',
      startOn: addDays(t, -40),
      finishedBy: addDays(t, 60),
    },
    {
      id: 'i2',
      number: 2,
      lane: 'Prepare',
      name: 'Building TLN',
      degree: 2,
      status: 'active',
      vision: 'The Life NOW book, planner, journal and app, ready to put in people’s hands.',
      youAreHere: 'Planner pages are designed. The cover is close. The book is a rough draft.',
      finishedWhen: 'Someone I have never met is using the planner and the app on their own.',
      startOn: addDays(t, -120),
      finishedBy: undefined,
    },
    {
      id: 'i3',
      number: 3,
      lane: 'Observe',
      name: 'TMKS',
      degree: 2,
      status: 'active',
      vision: 'Work through The Master’s Key System week by week and write down what it shows me.',
      youAreHere: 'Weeks 1 to 5 are read and noted.',
      finishedWhen: 'I have a one-page summary of the framework in my own words.',
      startOn: addDays(t, -70),
      finishedBy: addDays(t, 90),
    },
  ];

  const wm = (
    id: string,
    initiativeId: string,
    number: number,
    title: string,
    stake: string,
    reachBy: number,
    reached: Waymark['checkIn']['reached'] = null,
  ): Waymark => ({
    id,
    initiativeId,
    number,
    title,
    stake,
    reachBy: addDays(t, reachBy),
    status: 'active',
    checkIn: { reached, coreKept: reached ? true : null, on: reached ? addDays(t, reachBy) : undefined },
  });

  const waymarks: Waymark[] = [
    wm('w1-1', 'i1', 1, 'Kitchen and living room clear', 'Every surface is clear when I go to bed', -14, 'Yes'),
    wm('w1-2', 'i1', 2, 'Garage sorted', 'Everything in the garage is kept, given, or gone', 10),
    wm('w1-3', 'i1', 3, 'Office ready for work', 'Only today’s work is on the desk', 30),
    wm('w1-4', 'i1', 4, 'Put away childish things', 'I have named and let go of what keeps me small', 60),

    wm('w2-1', 'i2', 1, 'Planner pages designed', 'Every workbook page has a final layout', -20, 'Yes'),
    wm('w2-2', 'i2', 2, 'Planner ready to print', 'The final files are with the printer', 5),
    wm('w2-3', 'i2', 3, 'Book drafted', 'The full draft is in one file', 45),
    wm('w2-4', 'i2', 4, 'App in testers’ hands', 'Five people have tried the Blank Slate', 75),

    wm('w3-1', 'i3', 1, 'Weeks 1 to 5 read and noted', 'A page of notes for each week', -7, 'Yes'),
    wm('w3-2', 'i3', 2, 'Weeks 6 to 12 read and noted', 'A page of notes for each week', 35),
    wm('w3-3', 'i3', 3, 'Framework in my own words', 'A one-page summary I could explain to a friend', 90),
  ];

  const d = (
    id: string,
    text: string,
    code: Do['code'],
    dayOffset: number,
    priority: Do['priority'],
    hours: number,
    waymarkId?: string,
    initiativeId?: string,
    sortNo?: number,
    done = false,
  ): Do => ({ id, text, code, date: addDays(t, dayOffset), done, waymarkId, initiativeId, sortNo, priority, hours });

  const dos: Do[] = [
    d('do-garage', 'Sort two garage shelves: keep, give, gone', '1.2', 0, 1, 1, 'w1-2', 'i1', 1),
    d('do-donate', 'Drop the give-away boxes at the donation center', '1.2', 1, 2, 1, 'w1-2', 'i1', 2),
    d('do-drawers', 'Clear the desk drawers', '1.3', 3, 2, 1, 'w1-3', 'i1', 1),
    d('do-cover', 'Finish the cover page and send it to print', '2.2', 0, 1, 2, 'w2-2', 'i2', 1),
    d('do-proof', 'Proof the Count the Cost page', '2.2', 0, 2, 1, 'w2-2', 'i2', 2),
    d('do-tester', 'Try the Blank Slate on my own phone for a week', '2.4', 2, 3, 0.5, 'w2-4', 'i2', 1),
    d('do-tmks6', 'Read week 6 and write one page of notes', '3.2', 0, 2, 1, 'w3-2', 'i3', 1),
    d('do-insurance', 'Call the insurance company about the renewal', 'D', 0, 3, 0.5),
    d('do-tmks5', 'Write up week 5 notes', '3.1', -2, 2, 1, 'w3-1', 'i3', 5, true),
  ];

  const seeds: SeedItem[] = [
    {
      id: 'seed-workshop',
      text: 'A one-day TLN workshop at church',
      why: 'Saved for after the planner is printed.',
      savedOn: addDays(t, -30),
    },
  ];

  return {
    season: {
      id: 'season-1',
      name: 'Build The Life NOW',
      strategy: 'Clear the ground, build what I am called to build, and keep learning, without cutting Rest, Prayer & Devotion, or Fellowship.',
      startedOn: addDays(t, -120),
      sabbath: { label: 'Friday sundown to Saturday sundown', startDay: 5, startHour: 18, endDay: 6, endHour: 18 },
    },
    initiatives,
    waymarks,
    dos,
    seeds,
    core: {},
    nextInitiativeNumber: 4,
  };
}
