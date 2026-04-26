import type { CadDocument, CadPoint } from './types';

export type ServerDocumentRecord = {
  id: string;
  title: string;
  document: CadDocument;
  createdAt: string;
  updatedAt: string;
  readonly?: boolean;
  shareToken?: string;
};

export type ReviewComment = {
  id: string;
  documentId: string;
  entityId?: string;
  point?: CadPoint;
  message: string;
  author: string;
  createdAt: string;
  resolved: boolean;
};

export type ShareLink = {
  token: string;
  documentId: string;
  readonly: true;
  createdAt: string;
};

export type CollaborationState = {
  serverDocumentId?: string;
  shareToken?: string;
  readonly: boolean;
  lastServerSavedAt?: string;
  serverSavedRevision?: number;
};

export type SaveServerDocumentInput = {
  id?: string;
  title: string;
  document: CadDocument;
};

export type AddReviewCommentInput = Omit<ReviewComment, 'id' | 'createdAt' | 'resolved'>;

const serverDocumentsKey = 'simplecad.serverDocuments';
const shareLinksKey = 'simplecad.shareLinks';
const reviewCommentsKey = 'simplecad.reviewComments';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isCadDocument = (value: unknown): value is CadDocument => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    Array.isArray(value.layers) &&
    Array.isArray(value.entities) &&
    isString(value.units)
  );
};

const isCadPoint = (value: unknown): value is CadPoint =>
  isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';

const isServerDocumentRecord = (value: unknown): value is ServerDocumentRecord => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.title) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isCadDocument(value.document) &&
    (value.shareToken === undefined || isString(value.shareToken)) &&
    (value.readonly === undefined || typeof value.readonly === 'boolean')
  );
};

const isShareLink = (value: unknown): value is ShareLink =>
  isRecord(value) &&
  isString(value.token) &&
  isString(value.documentId) &&
  value.readonly === true &&
  isString(value.createdAt);

const isReviewComment = (value: unknown): value is ReviewComment =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.documentId) &&
  (value.entityId === undefined || isString(value.entityId)) &&
  (value.point === undefined || isCadPoint(value.point)) &&
  isString(value.message) &&
  isString(value.author) &&
  isString(value.createdAt) &&
  typeof value.resolved === 'boolean';

const readCollection = <T>(key: string, guard: (value: unknown) => value is T): T[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(guard) : [];
  } catch {
    return [];
  }
};

const writeCollection = <T>(key: string, value: T[]) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const makeId = (prefix: string) => {
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${randomPart}`;
};

const cloneDocument = (document: CadDocument): CadDocument =>
  typeof structuredClone === 'function'
    ? structuredClone(document)
    : (JSON.parse(JSON.stringify(document)) as CadDocument);

export class LocalCollaborationRepository {
  listDocuments(): ServerDocumentRecord[] {
    return readCollection(serverDocumentsKey, isServerDocumentRecord).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  saveDocument(input: SaveServerDocumentInput): ServerDocumentRecord {
    const documents = readCollection(serverDocumentsKey, isServerDocumentRecord);
    const now = new Date().toISOString();
    const existing = input.id ? documents.find((document) => document.id === input.id) : undefined;
    const nextRecord: ServerDocumentRecord = {
      id: existing?.id ?? makeId('doc'),
      title: input.title.trim() || input.document.name || 'Untitled',
      document: cloneDocument(input.document),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      readonly: existing?.readonly,
      shareToken: existing?.shareToken,
    };
    const nextDocuments = existing
      ? documents.map((document) => (document.id === existing.id ? nextRecord : document))
      : [...documents, nextRecord];
    writeCollection(serverDocumentsKey, nextDocuments);
    return nextRecord;
  }

  openDocument(id: string): ServerDocumentRecord | null {
    const document = readCollection(serverDocumentsKey, isServerDocumentRecord).find(
      (record) => record.id === id,
    );
    return document ? { ...document, document: cloneDocument(document.document) } : null;
  }

  createShareLink(documentId: string): ShareLink {
    const documents = readCollection(serverDocumentsKey, isServerDocumentRecord);
    const document = documents.find((record) => record.id === documentId);
    if (!document) {
      throw new Error(`Server document not found: ${documentId}`);
    }

    const links = readCollection(shareLinksKey, isShareLink);
    const existing = links.find((link) => link.documentId === documentId);
    const link: ShareLink =
      existing ?? {
        token: makeId('share'),
        documentId,
        readonly: true,
        createdAt: new Date().toISOString(),
      };
    if (!existing) {
      writeCollection(shareLinksKey, [...links, link]);
    }

    const nextDocuments = documents.map((record) =>
      record.id === documentId ? { ...record, shareToken: link.token } : record,
    );
    writeCollection(serverDocumentsKey, nextDocuments);
    return link;
  }

  resolveShareLink(token: string): ServerDocumentRecord | null {
    const link = readCollection(shareLinksKey, isShareLink).find((item) => item.token === token);
    if (!link) return null;
    const document = this.openDocument(link.documentId);
    return document ? { ...document, readonly: true, shareToken: token } : null;
  }

  listComments(documentId: string): ReviewComment[] {
    return readCollection(reviewCommentsKey, isReviewComment)
      .filter((comment) => comment.documentId === documentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  addComment(input: AddReviewCommentInput): ReviewComment {
    const comment: ReviewComment = {
      ...input,
      id: makeId('comment'),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    writeCollection(reviewCommentsKey, [
      ...readCollection(reviewCommentsKey, isReviewComment),
      comment,
    ]);
    return comment;
  }

  toggleCommentResolved(documentId: string, commentId: string): ReviewComment | null {
    const comments = readCollection(reviewCommentsKey, isReviewComment);
    let updated: ReviewComment | null = null;
    const nextComments = comments.map((comment) => {
      if (comment.documentId !== documentId || comment.id !== commentId) return comment;
      updated = { ...comment, resolved: !comment.resolved };
      return updated;
    });
    writeCollection(reviewCommentsKey, nextComments);
    return updated;
  }
}
