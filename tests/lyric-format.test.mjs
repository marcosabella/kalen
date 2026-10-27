import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSelection, remapFormats, transformSongLyrics, validFormats } from '../src/lyric-format.mjs';
import { validSong, validCue, validateLibrary } from '../src/domain.mjs';
import { shiftLyrics } from '../src/tonality.mjs';
import { withoutChords, cleanTranscription } from '../src/chords.mjs';
test('combina estilos, divide selecciones superpuestas y quita formato',()=>{
 let f=formatSelection([],0,10,{bold:true});f=formatSelection(f,3,7,{italic:true,color:'#ff0000'});
 assert.deepEqual(f,[{start:0,end:3,bold:true},{start:3,end:7,bold:true,italic:true,color:'#ff0000'},{start:7,end:10,bold:true}]);
 assert.deepEqual(formatSelection(f,0,10,{bold:false,italic:false,color:undefined}),[]);
});
test('insertar y borrar conserva el formato del texto restante',()=>{
 const f=[{start:4,end:9,bold:true}];assert.deepEqual(remapFormats(f,'Una letra','X Una letra'),[{start:6,end:11,bold:true}]);
 assert.deepEqual(remapFormats(f,'Una letra','Una le'),[{start:4,end:6,bold:true}]);
});
test('transposición, limpieza y guardar sin acordes conservan el formato',()=>{
 const song={id:'s',title:'Tema',artist:'',lyrics:'[C]Hola [G]mundo',lyricFormats:[{start:3,end:7,bold:true},{start:11,end:16,color:'#ff0000'}]};
 const shifted=transformSongLyrics(song,t=>shiftLyrics(t,1));assert.equal(shifted.lyrics,'[C#]Hola [G#]mundo');
 assert.deepEqual(shifted.lyricFormats,[{start:4,end:8,bold:true},{start:13,end:18,color:'#ff0000'}]);
 const plain=transformSongLyrics(song,withoutChords);assert.equal(plain.lyrics,'Hola mundo');assert.deepEqual(plain.lyricFormats,[{start:0,end:4,bold:true},{start:5,end:10,color:'#ff0000'}]);
 assert.deepEqual(transformSongLyrics({...song,lyrics:'  '+song.lyrics,lyricFormats:[{start:5,end:9,bold:true}]},cleanTranscription).lyricFormats,[{start:3,end:7,bold:true}]);
});
test('exportación y sincronización admiten estilos; rechazan rangos y colores inválidos',()=>{
 const song={id:'s',title:'Tema',artist:'',lyrics:'Hola',lyricFormats:[{start:0,end:4,bold:true,color:'#ff0000'}]};
 assert.ok(validSong(song));assert.ok(validCue({song,stanza:0}));assert.ok(validateLibrary(JSON.parse(JSON.stringify({songs:[song],order:['s']}))));
 assert.ok(validSong({...song,lyricFormats:undefined}));
 assert.equal(validFormats([{start:0,end:9}],4),false);assert.equal(validFormats([{start:0,end:4,color:'url(x)'}],4),false);
 assert.equal(validFormats([{start:0,end:3},{start:2,end:4}],4),false);
});
