// A citation chip that jumps to the record with the same HTML id on the page.
export function EvidenceLink({ id }: { id: string }) {
  return (
    <a className="caseid evidence-link" href={`#${id}`}>
      {id}
    </a>
  );
}
