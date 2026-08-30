export default function EmptyState({ message = 'Nothing here yet.' }) {
  return <p className="state state-empty">{message}</p>;
}
