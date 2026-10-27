import test from 'node:test';import assert from 'node:assert/strict';
import {parseChordSearch,parseChordPage,hasChords,withoutChords} from '../src/chords.mjs';
const search=`<table><tr><td><a href="/grupo/">Grupo &amp; Amigos</a></td><td><li id='r000'><a href="javascript:">Canción de prueba</a></li></td></tr></table><script>var hds=['grupo'];var fns=['cancion_de_prueba'];</script>`;
test('lee resultados sin ejecutar scripts y filtra artista',()=>{const results=parseChordSearch(search,'Canción de prueba','grupo');assert.equal(results.length,1);assert.equal(results[0].sourceUrl,'https://acordes.lacuerda.net/grupo/cancion_de_prueba.shtml');assert.equal(results[0].artist,'Grupo & Amigos');assert.equal(parseChordSearch(search,'Canción','otro').length,0);assert.deepEqual(parseChordSearch('<script>alert(1)</script>','tema'),[]);});
test('alinea acordes sobre la letra y conserva estrofas, intro y extensiones',()=>{const html=`<pre id='tCode'></pre><div id=t_body><PRE><A>C</A>    <A>G/B</A>\nCanta conmigo\n\nIntro:\n<A>Am</A>-<A>Fmaj7</A> (x2)\n\n&lt;texto&gt;</PRE></div>`;const result=parseChordPage(html);assert.equal(result,'[C]Canta[G/B] conmigo\n\nIntro:\n[Am]-[Fmaj7] (x2)\n\n<texto>');assert.ok(hasChords(result));assert.equal(parseChordPage('<div id=t_body><pre>Letra sin acordes</pre></div>'),null);});
test('guardar solo letra elimina acordes y conserva etiquetas de secciones',()=>{assert.equal(withoutChords('[C]Canta [G/B]conmigo\n\n[Intro]\n[Am]Otra estrofa'),'Canta conmigo\n\n[Intro]\nOtra estrofa');assert.equal(hasChords('[Intro]'),false);});

test('omite apéndices de digitaciones y comentarios al guardar solo letra',async()=>{
 const {cleanTranscription}=await import('../src/chords.mjs');
 const appendix=`\n\n* - ACORDES - *\n\nBm  = 2 2 4 4 3 2\nF#m = 2 4 4 2 2 2\nB7  = 2 2 4 2 4 2\nEm  = 0 2 2 0 0 0\nF#  = 2 4 4 3 2 2\nA   = X 0 2 2 2 0\n\nno transcribi yo, pero esta bien, y si te cuesta la tonalidad hacela\nen Lam y ponele tranporte en el segundo (o como se te cante)\n\nbuen tema`;
 assert.equal(cleanTranscription('[Bm]Un verso\n\n[F#m]Otro verso'+appendix),'[Bm]Un verso\n\n[F#m]Otro verso');
 assert.equal(withoutChords('[Bm]Un verso\n\n[F#m]Otro verso'+appendix),'Un verso\n\nOtro verso');
});
test('un bloque de posiciones al comienzo no elimina la canción posterior',async()=>{
 const {cleanTranscription}=await import('../src/chords.mjs');
 assert.equal(cleanTranscription('ACORDES\nBm = 2 2 4 4 3 2\nComentario del autor\n\nESTRIBILLO\n[Bm]Una canción'),'ESTRIBILLO\n[Bm]Una canción');
 assert.equal(cleanTranscription('La canción habla de acordes\ny cuenta una historia'),'La canción habla de acordes\ny cuenta una historia');
});
