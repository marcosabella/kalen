import type { LyricFormat } from '../data';
import { formatSegments } from '../lyric-format.mjs';
export default function FormattedText({text,formats,offset=0}:{text:string;formats?:LyricFormat[];offset?:number}) {
 return <>{formatSegments(text,formats,offset).map((r,i)=><span key={i} style={{fontWeight:r.bold?700:undefined,fontStyle:r.italic?'italic':undefined,textDecoration:r.underline?'underline':undefined,color:r.color}}>{r.text}</span>)}</>;
}
