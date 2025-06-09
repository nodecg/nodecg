/** The status of an Span.
 *
 * @deprecated Use string literals - if you require type casting, cast to SpanStatusType type
 */
var SpanStatus; (function (SpanStatus) {
  /** The operation completed successfully. */
  const Ok = 'ok'; SpanStatus["Ok"] = Ok;
  /** Deadline expired before operation could complete. */
  const DeadlineExceeded = 'deadline_exceeded'; SpanStatus["DeadlineExceeded"] = DeadlineExceeded;
  /** 401 Unauthorized (actually does mean unauthenticated according to RFC 7235) */
  const Unauthenticated = 'unauthenticated'; SpanStatus["Unauthenticated"] = Unauthenticated;
  /** 403 Forbidden */
  const PermissionDenied = 'permission_denied'; SpanStatus["PermissionDenied"] = PermissionDenied;
  /** 404 Not Found. Some requested entity (file or directory) was not found. */
  const NotFound = 'not_found'; SpanStatus["NotFound"] = NotFound;
  /** 429 Too Many Requests */
  const ResourceExhausted = 'resource_exhausted'; SpanStatus["ResourceExhausted"] = ResourceExhausted;
  /** Client specified an invalid argument. 4xx. */
  const InvalidArgument = 'invalid_argument'; SpanStatus["InvalidArgument"] = InvalidArgument;
  /** 501 Not Implemented */
  const Unimplemented = 'unimplemented'; SpanStatus["Unimplemented"] = Unimplemented;
  /** 503 Service Unavailable */
  const Unavailable = 'unavailable'; SpanStatus["Unavailable"] = Unavailable;
  /** Other/generic 5xx. */
  const InternalError = 'internal_error'; SpanStatus["InternalError"] = InternalError;
  /** Unknown. Any non-standard HTTP status code. */
  const UnknownError = 'unknown_error'; SpanStatus["UnknownError"] = UnknownError;
  /** The operation was cancelled (typically by the user). */
  const Cancelled = 'cancelled'; SpanStatus["Cancelled"] = Cancelled;
  /** Already exists (409) */
  const AlreadyExists = 'already_exists'; SpanStatus["AlreadyExists"] = AlreadyExists;
  /** Operation was rejected because the system is not in a state required for the operation's */
  const FailedPrecondition = 'failed_precondition'; SpanStatus["FailedPrecondition"] = FailedPrecondition;
  /** The operation was aborted, typically due to a concurrency issue. */
  const Aborted = 'aborted'; SpanStatus["Aborted"] = Aborted;
  /** Operation was attempted past the valid range. */
  const OutOfRange = 'out_of_range'; SpanStatus["OutOfRange"] = OutOfRange;
  /** Unrecoverable data loss or corruption */
  const DataLoss = 'data_loss'; SpanStatus["DataLoss"] = DataLoss;
})(SpanStatus || (SpanStatus = {}));

export { SpanStatus };
//# sourceMappingURL=spanstatus.js.map
