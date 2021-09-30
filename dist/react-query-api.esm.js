import { rest, setupWorker } from 'msw';

var users = [{
  id: "u_1",
  name: "Tyler",
  profilePictureUrl: "https://pbs.twimg.com/profile_images/1428205319616798721/xmr7q976_400x400.jpg"
}, {
  id: "u_2",
  name: "Bono",
  profilePictureUrl: "https://pbs.twimg.com/profile_images/1384860221110095873/f8s_E6a6_400x400.jpg"
}, {
  id: "u_3",
  name: "Tanner",
  profilePictureUrl: "https://pbs.twimg.com/profile_images/1164219021283094530/ACRln2kL_400x400.jpg"
}, {
  id: "u_4",
  name: "Alex",
  profilePictureUrl: "https://pbs.twimg.com/profile_images/1403026826075779075/cHtraFgQ_400x400.jpg"
}];
var labels = [{
  id: "l_1",
  color: "red",
  name: "bug"
}, {
  id: "l_2",
  color: "blue",
  name: "feature"
}, {
  id: "l_3",
  color: "cyan",
  name: "enhancement"
}, {
  id: "l_4",
  color: "orange",
  name: "question"
}, {
  id: "l_5",
  color: "lime",
  name: "help wanted"
}, {
  id: "l_6",
  color: "white",
  name: "wontfix"
}, {
  id: "l_7",
  color: "rebeccapurple",
  name: "duplicate"
}, {
  id: "l_8",
  color: "yellow",
  name: "help-wanted"
}];
var templateIssues = ["Dependencies need to be updated", "Poor performance on Windows devices", "Poor performance on macOS devices", "Poor performance on Android devices", "Holding down the space bar causes the processor to heat up", "Error: \"Cannot read property 'length' of undefined\"", "The app is crashing on iOS devices", "How am I supposed to create new tasks?", "Styling on the profile page looks weird.", "Feature: Build out multiplayer connectivity", "Feature: Build out a leaderboard"];
var templateIssueComments = ["I'm on it!", "I'm not sure what the problem is.", "I'm working on it.", "I'm not sure how to fix it.", "I'm not sure if I can reproduce the problem.", "This is a really big deal for me.", "Has there been any progress on this?", "What is the status of this issue?", "Never mind, I figured out how to fix this", "Can you send me a little bit more information about the problem.", "I've reproduced this issue. Working on a fix now.", "I'm on it. I'll get back to you when I'm done.", "It would seem this is caused by user error.", "Whoops, I just dropped the production database. Hang on..."];
var allStatus = ["backlog", "todo", "inProgress", "done", "cancelled"];
var issues = /*#__PURE__*/Array.from({
  length: 100
}, function (_, i) {
  var isCompleted = Math.random() > 0.9;
  return {
    id: "i_" + i,
    title: templateIssues[Math.floor(Math.random() * templateIssues.length)],
    labels: [labels[Math.floor(Math.random() * labels.length)]],
    comments: Array.from({
      length: Math.floor(Math.random() * 10) + 1
    }, function (_, j) {
      return {
        id: "c_" + i + "_" + j,
        createdDate: new Date(Date.now() - Math.floor(Math.random() * 100000)),
        createdBy: users[Math.floor(Math.random() * users.length)],
        issueId: "i_" + i,
        user: users[Math.floor(Math.random() * users.length)],
        comment: templateIssueComments[Math.floor(Math.random() * templateIssueComments.length)]
      };
    }),
    number: i + 1,
    status: isCompleted ? "done" : allStatus.filter(function (f) {
      return f !== "done";
    })[Math.floor(Math.random() * allStatus.length)],
    createdDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
    createdBy: users[Math.floor(Math.random() * users.length)],
    assignee: Math.random() > 0.5 ? users[Math.floor(Math.random() * users.length)] : null,
    dueDate: Math.random() > 0.5 ? new Date(Date.now() + Math.floor(Math.random() * 10000000)) : null,
    completedDate: isCompleted ? new Date(Date.now() + Math.floor(Math.random() * 10000000)) : null
  };
});

var handlers = [/*#__PURE__*/rest.get('/api/issues', function (req, res, ctx) {
  var query = req.url.searchParams;
  var page = Number(query.get('page')) || 1;
  var perPage = Number(query.get('limit')) || 10;
  var statusFilter = query.get('status');
  var labels = query.getAll('labels[]');
  var order = query.get('order') || 'desc';
  var filteredIssues = issues.filter(function (issue) {
    if (statusFilter) {
      if (issue.status !== statusFilter) return false;
    } else {
      if (issue.status === 'done' || issue.status === 'cancelled') return false;
    }

    if (labels.length > 0) {
      if (!labels.some(function (label) {
        return issue.labels.find(function (l) {
          return l.name === label;
        });
      })) {
        return false;
      }
    }

    return true;
  });
  var sortedIssues = filteredIssues.sort(function (a, b) {
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
  var pagedIssues = sortedIssues.slice((page - 1) * perPage, page * perPage);
  return res(ctx.status(200), ctx.json(pagedIssues));
}), /*#__PURE__*/rest.get('/api/issues/:number', function (req, res, ctx) {
  var number = Number(req.params.number);
  var issue = issues.find(function (issue) {
    return issue.number === number;
  });

  if (!issue) {
    return res(ctx.status(404), ctx.json({
      message: 'Not found'
    }));
  }

  return res(ctx.status(200), ctx.json(issue));
}), /*#__PURE__*/rest.get('/api/issues/:number/comments', function (req, res, ctx) {
  var number = Number(req.params.number);
  var issue = issues.find(function (issue) {
    return issue.number === number;
  });

  if (!issue) {
    return res(ctx.status(404), ctx.json({
      message: 'Not found'
    }));
  }

  return res(ctx.status(200), ctx.json(issue.comments));
}), /*#__PURE__*/rest.post('/api/issues/:number/comments', function (req, res, ctx) {
  var number = Number(req.params.number);
  var issue = issues.find(function (issue) {
    return issue.number === number;
  });

  if (!issue) {
    return res(ctx.status(404), ctx.json({
      message: 'Not found'
    }));
  }

  var body = JSON.parse(req.body);
  var createdBy = users.find(function (user) {
    return user.id === body.createdBy_id;
  });

  if (!createdBy) {
    return res(ctx.status(400), ctx.json({
      message: 'Not found'
    }));
  }

  var comment = {
    id: "c_" + issue.id + "_" + (issue.comments.length + 1),
    issueId: issue.id,
    createdDate: new Date(),
    createdBy: createdBy,
    comment: body.comment
  };
  issue.comments.push(comment);
  return res(ctx.status(201), ctx.json(comment));
}), /*#__PURE__*/rest.put('/api/issues/:number', function (req, res, ctx) {
  var number = Number(req.params.number);
  var issue = issues.find(function (issue) {
    return issue.number === number;
  });

  if (!issue) {
    return res(ctx.status(404), ctx.json({
      message: 'Not found'
    }));
  }

  var body = JSON.parse(req.body);

  if (body.title) {
    issue.title = body.title;
  }

  if (body.status) {
    issue.status = body.status;
  }

  if (body.labels) {
    issue.labels = body.labels.map(function (l) {
      return labels.find(function (lbl) {
        return lbl.name === l;
      });
    });
  }

  if (body.dueDate) {
    issue.dueDate = body.dueDate;
  }

  if (body.assignee) {
    issue.assignee = users.find(function (user) {
      return user.id === body.assignee;
    }) || null;
  }

  return res(ctx.status(200), ctx.json(issue));
}), /*#__PURE__*/rest.post('/api/issues/:number/complete', function (req, res, ctx) {
  var number = Number(req.params.number);
  var issue = issues.find(function (issue) {
    return issue.number === number;
  });

  if (!issue) {
    return res(ctx.status(404), ctx.json({
      message: 'Not found'
    }));
  }

  issue.createdDate = new Date();
  issue.status = 'done';
  return res(ctx.status(200), ctx.json(issue));
}), /*#__PURE__*/rest.post('/api/issues', function (req, res, ctx) {
  var body = JSON.parse(req.body);
  var number = issues.length + 1;
  var issue = {
    id: "i_" + number,
    number: number,
    title: body.title,
    status: 'backlog',
    comments: [{
      issueId: "i_" + number,
      id: "c_" + number + "_1",
      createdDate: new Date(),
      createdBy: users[Math.floor(Math.random() * users.length)],
      comment: body.comment
    }],
    createdDate: new Date(),
    createdBy: users[Math.floor(Math.random() * users.length)],
    dueDate: null,
    completedDate: null,
    assignee: null,
    labels: []
  };
  issues.push(issue);
  return res(ctx.status(201), ctx.json(issue));
}), /*#__PURE__*/rest.get('/api/labels', function (_req, res, ctx) {
  return res(ctx.status(200), ctx.json(labels));
}), /*#__PURE__*/rest.get('/api/labels/:labelId', function (req, res, ctx) {
  var labelId = req.params.labelId;
  var label = labels.find(function (l) {
    return l.name === labelId;
  });

  if (!label) {
    return res(ctx.status(404), ctx.json({
      message: 'Label not found'
    }));
  }

  return res(ctx.status(200), ctx.json(label));
}), /*#__PURE__*/rest.post('/api/labels', function (req, res, ctx) {
  if (!req.body || typeof req.body !== 'string') {
    return res(ctx.status(400), ctx.json({
      message: 'No body'
    }));
  }

  var parsedBody = JSON.parse(req.body);

  if (!parsedBody.name) {
    return res(ctx.status(400), ctx.json({
      message: 'No name'
    }));
  }

  var label = {
    id: "l_" + (labels.length + 1),
    name: parsedBody.name,
    color: parsedBody.color || 'red'
  };
  labels.push(label);
  return res(ctx.status(200), ctx.json(label));
}), /*#__PURE__*/rest.put('/api/labels/:labelId', function (req, res, ctx) {
  var labelId = req.params.labelId;
  var label = labels.find(function (l) {
    return l.name === labelId;
  });

  if (!label) {
    return res(ctx.status(404), ctx.json({
      message: 'Label not found'
    }));
  }

  if (!req.body || typeof req.body !== 'string') {
    return res(ctx.status(400), ctx.json({
      message: 'No body'
    }));
  }

  var parsedBody = JSON.parse(req.body);

  if (!parsedBody.name) {
    return res(ctx.status(400), ctx.json({
      message: 'No name'
    }));
  }

  if (parsedBody.name) {
    label.name = parsedBody.name;
  }

  if (parsedBody.color) {
    label.color = parsedBody.color;
  }

  return res(ctx.status(200), ctx.json(label));
}), /*#__PURE__*/rest["delete"]('/api/labels/:labelId', function (req, res, ctx) {
  var labelId = req.params.labelId;
  var label = labels.find(function (l) {
    return l.name === labelId;
  });

  if (!label) {
    return res(ctx.status(404), ctx.json({
      message: 'Label not found'
    }));
  }

  labels.splice(labels.indexOf(label), 1);
  return res(ctx.status(200), ctx.json(labels));
}), /*#__PURE__*/rest.get('/api/users', function (_req, res, ctx) {
  return res(ctx.status(200), ctx.json(users));
})];

var worker = /*#__PURE__*/setupWorker.apply(void 0, handlers);

export { worker };
//# sourceMappingURL=react-query-api.esm.js.map
