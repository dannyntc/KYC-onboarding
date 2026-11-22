'use client';
import { useRef, useState } from 'react';

// Decision note for an onboarding file. Keeps the file version the page was loaded with,
// so the server can reject a save made after somebody else changed the file.
export function OnboardingNote({
  initialNote,
  initialVersion,
  draft
}: {
  initialNote: string;
  initialVersion: number;
  draft?: string;
}) {
  const note = useRef<HTMLTextAreaElement>(null);
  const [version] = useState(initialVersion);

  function addDraft() {
    if (!note.current || !draft) return;
    note.current.value += `${note.current.value ? '\n\n' : ''}${draft}`;
    note.current.focus();
  }

  return (
    <>
      <input type="hidden" name="version" value={version} />
      <label htmlFor="decision-note" className="label">
        DECISION NOTE
      </label>
      <textarea ref={note} className="field" id="decision-note" name="note" defaultValue={initialNote} />
      {draft && (
        <button type="button" className="button secondary" onClick={addDraft}>
          Add draft to note
        </button>
      )}
    </>
  );
}
