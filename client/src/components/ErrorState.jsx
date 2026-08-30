export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state state-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
