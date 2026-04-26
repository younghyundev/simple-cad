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
  title?: string;
  description?: string;
  expiresAt?: string;
  deletedAt?: string;
};

export type CollaborationState = {
  serverDocumentId?: string;
  shareToken?: string;
  shareTitle?: string;
  shareDescription?: string;
  shareExpiresAt?: string;
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

export type SaveShareLinkInput = {
  token: string;
  documentId: string;
  title: string;
  description?: string;
  expiresAt?: string;
};

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
  isString(value.createdAt) &&
  (value.title === undefined || isString(value.title)) &&
  (value.description === undefined || isString(value.description)) &&
  (value.expiresAt === undefined || isString(value.expiresAt)) &&
  (value.deletedAt === undefined || isString(value.deletedAt));

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

  listShareLinks(): ShareLink[] {
    return readCollection(shareLinksKey, isShareLink)
      .filter((link) => !link.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  findShareLink(token: string): ShareLink | null {
    return readCollection(shareLinksKey, isShareLink).find((link) => link.token === token) ?? null;
  }

  saveShareLink(input: SaveShareLinkInput): ShareLink {
    const links = readCollection(shareLinksKey, isShareLink);
    const existing = links.find((link) => link.token === input.token);
    const link: ShareLink = {
      token: input.token,
      documentId: input.documentId,
      readonly: true,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      title: input.title.trim() || 'Untitled',
      description: input.description?.trim() || undefined,
      expiresAt: input.expiresAt,
      deletedAt: undefined,
    };
    writeCollection(shareLinksKey, existing
      ? links.map((item) => (item.token === input.token ? link : item))
      : [...links, link]);
    return link;
  }

  deleteShareLink(token: string): void {
    const deletedAt = new Date().toISOString();
    const links = readCollection(shareLinksKey, isShareLink);
    writeCollection(shareLinksKey, links.map((link) =>
      link.token === token ? { ...link, deletedAt } : link,
    ));

    const documents = readCollection(serverDocumentsKey, isServerDocumentRecord);
    writeCollection(serverDocumentsKey, documents.map((document) =>
      document.shareToken === token ? { ...document, shareToken: undefined } : document,
    ));
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
        title: document.title,
        description: undefined,
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
    if (!link || link.deletedAt || isShareLinkExpired(link)) return null;
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

export function isShareLinkExpired(link: ShareLink, now = new Date()): boolean {
  return Boolean(link.expiresAt && Number.isFinite(Date.parse(link.expiresAt)) && Date.parse(link.expiresAt) <= now.getTime());
}
