import { Issue, Label, User, IssueComment } from './types';

export let users: User[] = [
  {
    id: 'u_1',
    name: 'Tyler',
    profilePictureUrl:
      'https://res.cloudinary.com/uidotdev/image/twitter_name/tylermcginnis',
  },
  {
    id: 'u_2',
    name: 'Bono',
    profilePictureUrl:
      'https://res.cloudinary.com/uidotdev/image/twitter_name/u2',
  },
  {
    id: 'u_3',
    name: 'Tanner',
    profilePictureUrl:
      'https://res.cloudinary.com/uidotdev/image/twitter_name/tannerlinsley',
  },
  {
    id: 'u_4',
    name: 'Alex',
    profilePictureUrl:
      'https://res.cloudinary.com/uidotdev/image/twitter_name/ralex1993',
  },
];

export let labels: Label[] = [
  { id: 'bug', color: 'red', name: 'bug' },
  { id: 'feature', color: 'blue', name: 'feature' },
  { id: 'enhancement', color: 'cyan', name: 'enhancement' },
  { id: 'question', color: 'orange', name: 'question' },
  { id: 'help', color: 'lime', name: 'help wanted' },
  { id: 'wontfix', color: 'white', name: 'wontfix' },
  { id: 'duplicate', color: 'rebeccapurple', name: 'duplicate' },
];

const part1 = [
  'Dependencies',
  'The App',
  'Windows',
  'macOS',
  'Styling',
  'Button',
  'Target',
  'Input',
  'Field',
  'JavaScript',
  'React',
  'JQuery',
  'My Cookies',
];

const part2 = [
  'is having a problem',
  'seems to struggle',
  'throws an error',
  'makes my computer run slow',
  'causes the processor to heat up',
  'looks weird',
  "cannot read property 'length' of undefined",
  'is not working',
  'is not responding',
  'is not working properly',
  'is not working as expected',
  'is crashing',
  "won't run right",
  "is actually working fine. I just wanted to let you know you're great",
];
const part3 = [
  'when I rage click it',
  'on Tuesdays',
  'every time I wear my green shirt',
  "when I'm on a plane",
  "when I'm on a train",
  "when I'm on a boat",
  "when I'm on a bike",
  'right now',
  'all the time',
  'on weekends',
  "when I'm with Taylor Swift",
  'whenever I try to demo it',
];

const templateIssueComments = [
  "I'm on it!",
  "I'm not sure what the problem is.",
  "I'm working on it.",
  "I'm not sure how to fix it.",
  "I'm not sure if I can reproduce the problem.",
  'This is a really big deal for me.',
  'Has there been any progress on this?',
  'What is the status of this issue?',
  'Never mind, I figured out how to fix this',
  'Can you send me a little bit more information about the problem.',
  "I've reproduced this issue. Working on a fix now.",
  "I'm on it. I'll get back to you when I'm done.",
  'It would seem this is caused by user error.',
  'Whoops, I just dropped the production database. Hang on...',
];

const allStatus: (
  | 'backlog'
  | 'todo'
  | 'inProgress'
  | 'done'
  | 'cancelled'
)[] = ['backlog', 'todo', 'inProgress', 'done', 'cancelled'];

export let issueComments: IssueComment[] = [];

export const issues: Issue[] = Array.from({ length: 1000 }, (_, i) => {
  const isCompleted = Math.random() > 0.9;
  const comments: IssueComment[] = Array.from(
    { length: Math.floor(Math.random() * 10) + 1 },
    (_, j) => ({
      id: `c_${issueComments.length + j}`,
      createdDate: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
      createdBy: users[Math.floor(Math.random() * users.length)].id,
      issueId: `i_${i}`,
      comment:
        templateIssueComments[
          Math.floor(Math.random() * templateIssueComments.length)
        ],
    })
  );
  issueComments = issueComments
    .concat(comments)
    .sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
  const title = `${part1[Math.floor(Math.random() * part1.length)]} ${
    part2[Math.floor(Math.random() * part2.length)]
  } ${part3[Math.floor(Math.random() * part3.length)]}`;

  return {
    id: `i_${i}`,
    title,
    labels: [labels[Math.floor(Math.random() * labels.length)].id],
    comments: comments.map(c => c.id),
    number: i + 1,
    status: isCompleted
      ? 'done'
      : allStatus.filter(f => f !== 'done')[
          Math.floor(Math.random() * allStatus.length)
        ],
    createdDate: new Date(Date.now() - Math.floor(Math.random() * 10000000)),
    createdBy: users[Math.floor(Math.random() * users.length)].id,
    assignee:
      Math.random() > 0.5
        ? users[Math.floor(Math.random() * users.length)].id
        : null,
    dueDate:
      Math.random() > 0.5
        ? new Date(Date.now() + Math.floor(Math.random() * 10000000))
        : null,
    completedDate: isCompleted
      ? new Date(Date.now() + Math.floor(Math.random() * 10000000))
      : null,
  };
});
