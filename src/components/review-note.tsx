'use client';
import {useRef,useState} from 'react';

export function ReviewNote({initialNote,initialVersion,draft}:{initialNote:string;initialVersion:number;draft?:string}) {
 const note=useRef<HTMLTextAreaElement>(null);
 const [version]=useState(initialVersion);
 function addDraft(){
  if(!note.current || !draft) return;
  note.current.value += `${note.current.value ? '\n\n' : ''}${draft}`;
  note.current.focus();
 }
 return <>
  <input type="hidden" name="version" value={version}/>
  <label htmlFor="notes" className="label">ANALYST NOTE / REASON FOR ACTION</label>
  <textarea ref={note} className="field" id="notes" name="notes" defaultValue={initialNote} required/>
  {draft && <button type="button" className="button secondary" onClick={addDraft}>Add draft to analyst note</button>}
 </>;
}
