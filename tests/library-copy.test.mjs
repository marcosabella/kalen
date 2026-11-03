import assert from 'node:assert/strict';
import test from 'node:test';
import { libraryCopy } from '../src/library-copy.mjs';

const library = {songs:[{id:'s',title:'Tema',artist:'Artista',tonality:'C',lyrics:'[C]Hola\n\nOtra estrofa',lyricFormats:[{start:3,end:7,bold:true,italic:true,underline:true,color:'#ff0000'},{start:9,end:13,color:'#00ff00'}]}],order:['s']};

test('exportar e importar conserva todos los estilos, acordes, metadatos y orden',()=>{
 const exported = JSON.stringify(libraryCopy(library));
 const imported = libraryCopy(JSON.parse(exported));
 assert.deepEqual(imported,library);
 imported.songs[0].lyricFormats[0].color='#000000';
 assert.equal(library.songs[0].lyricFormats[0].color,'#ff0000');
});
test('exportar o importar sin formato elimina solo los estilos y no modifica el original',()=>{
 const {lyricFormats,...song}=library.songs[0];
 const expected={songs:[song],order:['s']};
 assert.deepEqual(libraryCopy(library,false),expected);
 assert.deepEqual(libraryCopy(JSON.parse(JSON.stringify(library)),false),expected);
 assert.equal(library.songs[0].lyricFormats.length,2);
 assert.deepEqual(libraryCopy(expected),expected);
});
test('copias inválidas se rechazan también al importar sin formato',()=>{
 assert.throws(()=>libraryCopy({songs:[{...library.songs[0],lyricFormats:[{start:0,end:999}]}],order:['s']},false));
 assert.throws(()=>libraryCopy({songs:[],order:['inexistente']}));
});
