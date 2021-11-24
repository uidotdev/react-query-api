import { DefaultRequestBody, RequestParams, rest, RestRequest } from 'msw';
import { issueComments, issues, labels, users } from './db';
import { Issue, IssueComment } from './types';

const makeUrl = (path: string) =>
  `${typeof window === 'undefined' ? 'http://localhost:8000' : ''}${path}`;

const handleErrorDelay = async (
  req: RestRequest<DefaultRequestBody, RequestParams>
) => {
  if (req.headers.get('x-delay')) {
    await new Promise(resolve =>
      setTimeout(resolve, Number(req.headers.get('x-delay')) || 0)
    );
  } else {
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 500 + 500)
    );
  }
  if (req.headers.get('x-error')) {
    if (Math.random() > 0.5) {
      throw new Error();
    }
  }
};

export const handlers = [
  rest.get(makeUrl('/api/status'), async (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ status: 'ok' }));
  }),
  rest.get(makeUrl('/api/issues'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
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
    const labelQuery = query.getAll('labels[]');
    const order = query.get('order') || 'desc';
    const filteredIssues = issues.filter(issue => {
      if (statusFilter) {
        if (issue.status !== statusFilter) return false;
      } else {
        if (issue.status === 'done' || issue.status === 'cancelled')
          return false;
      }
      if (labelQuery.length > 0) {
        if (
          !labelQuery.some(label => {
            const dbLabel = labels.find(l => l.name === label);
            if (!dbLabel) return false;
            return issue.labels.find(l => l === dbLabel.id);
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
  rest.get(makeUrl('/api/issues/:number'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    return res(ctx.status(200), ctx.json(issue));
  }),
  rest.get(makeUrl('/api/issues/:number/comments'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }

    return res(
      ctx.status(200),
      ctx.json(
        issue.comments.map(id =>
          issueComments.find(comment => comment.id === id)
        )
      )
    );
  }),
  rest.post<string>(
    makeUrl('/api/issues/:number/comments'),
    async (req, res, ctx) => {
      try {
        await handleErrorDelay(req);
      } catch {
        return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
      }
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
        createdBy: createdBy.id,
        comment: body.comment,
      };

      issue.comments.push();
      return res(ctx.status(201), ctx.json(comment));
    }
  ),
  rest.put<string>(makeUrl('/api/issues/:number'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const number = Number(req.params.number);
    const issue = issues.find(issue => issue.number === number);
    if (!issue) {
      return res(ctx.status(404), ctx.json({ message: 'Not found' }));
    }
    let body: Record<string, any> = {};
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    if (typeof req.body === 'object') body = req.body;

    if (body.title) {
      issue.title = body.title;
    }
    if (body.status) {
      issue.status = body.status;
    }
    if (body.labels) {
      issue.labels = body.labels
        .map((l: string) => labels.find(lbl => lbl.id === l)?.id)
        .filter(Boolean);
    }
    if (body.dueDate) {
      issue.dueDate = body.dueDate;
    }
    if (body.assignee) {
      issue.assignee =
        users.find(user => user.id === body.assignee)?.id || null;
    }

    return res(ctx.status(200), ctx.json(issue));
  }),
  rest.post<string>(
    makeUrl('/api/issues/:number/complete'),
    async (req, res, ctx) => {
      try {
        await handleErrorDelay(req);
      } catch {
        return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
      }
      const number = Number(req.params.number);
      const issue = issues.find(issue => issue.number === number);
      if (!issue) {
        return res(ctx.status(404), ctx.json({ message: 'Not found' }));
      }

      issue.createdDate = new Date();
      issue.status = 'done';

      return res(ctx.status(200), ctx.json(issue));
    }
  ),
  rest.post<string>(makeUrl('/api/issues'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    let body: Record<string, any> = {};
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    if (typeof req.body === 'object') body = req.body;
    const number = issues.length + 1;

    const issueComment = {
      issueId: `i_${number}`,
      id: `c_${issueComments.length}`,
      createdDate: new Date(),
      createdBy: users[Math.floor(Math.random() * users.length)].id,
      comment: body.comment,
    };
    issueComments.push(issueComment);
    const issue: Issue = {
      id: `i_${number}`,
      number,
      title: body.title,
      status: 'backlog',
      comments: [issueComment.id],
      createdDate: new Date(),
      createdBy: users[Math.floor(Math.random() * users.length)].id,
      dueDate: null,
      completedDate: null,
      assignee: null,
      labels: [],
    };

    issues.push(issue);
    return res(ctx.status(201), ctx.json(issue));
  }),

  rest.get(makeUrl('/api/labels'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    return res(ctx.status(200), ctx.json(labels));
  }),
  rest.get(makeUrl('/api/labels/:labelId'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const { labelId } = req.params;

    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.post(makeUrl('/api/labels'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    let body: Record<string, any> = {};
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    if (typeof req.body === 'object') body = req.body;

    if (!body.name) {
      return res(ctx.status(400), ctx.json({ message: 'No name' }));
    }
    if (labels.find(l => l.name === body.name))
      return res(
        ctx.status(400),
        ctx.json({ message: 'Label already exists' })
      );

    const label = {
      id: body.name,
      name: body.name,
      color: body.color || 'red',
    };
    labels.push(label);
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.put(makeUrl('/api/labels/:labelId'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const { labelId } = req.params;
    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    let body: Record<string, any> = {};
    if (typeof req.body === 'string') body = JSON.parse(req.body);
    if (typeof req.body === 'object') body = req.body;

    if (!body.name) {
      return res(ctx.status(400), ctx.json({ message: 'No name' }));
    }
    if (body.name) {
      label.name = body.name;
    }
    if (body.color) {
      label.color = body.color;
    }
    return res(ctx.status(200), ctx.json(label));
  }),
  rest.delete(makeUrl('/api/labels/:labelId'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const { labelId } = req.params;
    const label = labels.find(l => l.name === labelId);
    if (!label) {
      return res(ctx.status(404), ctx.json({ message: 'Label not found' }));
    }
    labels.splice(labels.indexOf(label), 1);
    return res(ctx.status(200), ctx.json(labels));
  }),

  rest.get(makeUrl('/api/users'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    return res(ctx.status(200), ctx.json(users));
  }),
  rest.get(makeUrl('/api/users/:userId'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const { userId } = req.params;

    const user = users.find(l => l.id === userId);
    if (!user) {
      return res(ctx.status(404), ctx.json({ message: 'User not found' }));
    }
    return res(ctx.status(200), ctx.json(user));
  }),

  rest.get(makeUrl('/api/search/issues'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const query = req.url.searchParams.get('q') || '';
    if (!query) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'Search query is required' })
      );
    }
    const filteredList = issues.filter(issue => issue.title.includes(query));
    return res(
      ctx.status(200),
      ctx.json({ count: filteredList.length, items: filteredList })
    );
  }),
  rest.get(makeUrl('/api/search/labels'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const query = req.url.searchParams.get('q') || '';
    if (!query) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'Search query is required' })
      );
    }
    const filteredList = labels.filter(label => label.name.includes(query));
    return res(
      ctx.status(200),
      ctx.json({ count: filteredList.length, items: filteredList })
    );
  }),
  rest.get(makeUrl('/api/search/comments'), async (req, res, ctx) => {
    try {
      await handleErrorDelay(req);
    } catch {
      return res(ctx.status(500), ctx.json({ error: 'Error in request' }));
    }
    const query = req.url.searchParams.get('q') || '';
    if (!query) {
      return res(
        ctx.status(401),
        ctx.json({ message: 'Search query is required' })
      );
    }
    const filteredList = issueComments.filter(comment =>
      comment.comment.includes(query)
    );
    return res(
      ctx.status(200),
      ctx.json({ count: filteredList.length, items: filteredList })
    );
  }),
];
