import { rest } from 'msw';
import { issues, labels, users } from './db';
import { Issue, IssueComment } from './types';

export const handlers = [
  rest.get('/api/issues', (req, res, ctx) => {
    const query = req.url.searchParams;
    const page = Number(query.get('page')) || 1;
    const perPage = Number(query.get('limit')) || 10;
    const statusFilter = query.get('status') as
      | 'backlog'
      | 'todo'
      | 'inProgress'
      | 'done'
      | 'cancelled'
      | null;
    const labels = query.getAll('labels[]');
    const order = query.get('order') || 'desc';
    const filteredIssues = issues.filter(issue => {
      if (statusFilter) {
        if (issue.status !== statusFilter) return false;
      } else {
        if (issue.status === 'done' || issue.status === 'cancelled')
          return false;
      }
      if (labels.length > 0) {
        if (
          !labels.some(label => {
            return issue.labels.find(l => l.name === label);
          })
        ) {
          return false;
        }
      }
      return true;
    });
    const sortedIssues = filteredIssues.sort((a, b) => {
      if (order === 'asc') {
        if (a.number < b.number) return -1;
        if (a.number > b.number) return 1;
        return 0;
      } else {
        if (a.number < b.number) return 1;
        if (a.number > b.number) return -1;
        return 0;
      }
    });
    const pagedIssues = sortedIssues.slice(
      (page - 1) * perPage,
      page * perPage
    );
    return res(ctx.status(200), ctx.json(pagedIssues));
  }),
  rest.get('/api/issues/:number', (req, res, ctx) => {
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    return res(ctx.status(200), ctx.json(issue));
  }),
  rest.get('/api/issues/:number/comments', (req, res, ctx) => {
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    return res(ctx.status(200), ctx.json(issue.comments));
  }),
  rest.post<string>('/api/issues/:number/comments', (req, res, ctx) => {
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    const body: { createdBy_id: string; comment: string } = JSON.parse(
      req.body
    );
    const createdBy = users.find(user => user.id === body.createdBy_id);
    if (!createdBy) {
      return res(ctx.status(400), ctx.json({ message: 'Not found' }));
    }
    const comment: IssueComment = {
      id: `c_${issue.id}_${issue.comments.length + 1}`,
      issueId: issue.id,
      createdDate: new Date(),
      createdBy,
      comment: body.comment,
    };

    issue.comments.push(comment);
    return res(ctx.status(201), ctx.json(comment));
  }),
  rest.put<string>('/api/issues/:number', (req, res, ctx) => {
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    const body = JSON.parse(req.body);

    if (body.title) {
      issue.title = body.title;
    }
    if (body.status) {
      issue.status = body.status;
    }
    if (body.labels) {
      issue.labels = body.labels.map((l: string) =>
        labels.find(lbl => lbl.name === l)
      );
    }
    if (body.dueDate) {
      issue.dueDate = body.dueDate;
    }
    if (body.assignee) {
      issue.assignee = users.find(user => user.id === body.assignee) || null;
    }

    return res(ctx.status(200), ctx.json(issue));
  }),
  rest.post<string>('/api/issues/:number/complete', (req, res, ctx) => {
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }

    issue.createdDate = new Date();
    issue.status = 'done';

    return res(ctx.status(200), ctx.json(issue));
  }),
  rest.post<string>('/api/issues', (req, res, ctx) => {
    const body = JSON.parse(req.body);
    const number = issues.length + 1;
    const issue: Issue = {
      id: `i_${number}`,
      number,
      title: body.title,
      status: 'backlog',
      comments: [
        {
          issueId: `i_${number}`,
          id: `c_${number}_1`,
          createdDate: new Date(),
          createdBy: users[Math.floor(Math.random() * users.length)],
          comment: body.comment,
        },
      ],
      createdDate: new Date(),
      createdBy: users[Math.floor(Math.random() * users.length)],
      dueDate: null,
      completedDate: null,
      assignee: null,
      labels: [],
    };

    issues.push(issue);
    return res(ctx.status(201), ctx.json(issue));
  }),

  rest.get('/api/labels', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(labels));
  }),
  rest.get('/api/labels/:labelId', (req, res, ctx) => {
    const { labelId } = req.params;

    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.post('/api/labels', (req, res, ctx) => {
    if (!req.body || typeof req.body !== 'string') {
      return res(ctx.status(400), ctx.json({ message: 'No body' }));
    }
    const parsedBody = JSON.parse(req.body);
    if (!parsedBody.name) {
      return res(ctx.status(400), ctx.json({ message: 'No name' }));
    }
    const label = {
      id: `l_${labels.length + 1}`,
      name: parsedBody.name,
      color: parsedBody.color || 'red',
    };
    labels.push(label);
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.put('/api/labels/:labelId', (req, res, ctx) => {
    const { labelId } = req.params;
    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    if (!req.body || typeof req.body !== 'string') {
      return res(ctx.status(400), ctx.json({ message: 'No body' }));
    }
    const parsedBody = JSON.parse(req.body);
    if (!parsedBody.name) {
      return res(ctx.status(400), ctx.json({ message: 'No name' }));
    }
    if (parsedBody.name) {
      label.name = parsedBody.name;
    }
    if (parsedBody.color) {
      label.color = parsedBody.color;
    }
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.delete('/api/labels/:labelId', (req, res, ctx) => {
    const { labelId } = req.params;
    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    labels.splice(labels.indexOf(label), 1);
    return res(ctx.status(200), ctx.json(labels));
  }),

  rest.get('/api/users', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(users));
  }),
];
