export interface User {
  id: string;
  name: string;
  profilePictureUrl: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Issue {
  id: string;
  number: number;
  title: string;
  status: "backlog" | "todo" | "inProgress" | "done" | "cancelled";
  dueDate: Date | null;
  createdDate: Date;
  createdBy: User;
  completedDate: Date | null;
  assignee: User | null;
  labels: Label[];
  comments: IssueComment[];
}

export interface IssueComment {
  id: string;
  issueId: string;
  comment: string;
  createdDate: Date;
  createdBy: User;
}
