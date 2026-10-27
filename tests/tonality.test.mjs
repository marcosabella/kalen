import test from 'node:test';
import assert from 'node:assert/strict';
import { transposeLyrics, validTonality } from '../src/tonality.mjs';
import { validateLibrary, validCue } from '../src/domain.mjs';
test('transpone acordes con bajos, extensiones y texto intacto',()=>{
 assert.equal(transposeLyrics('[Am]Vuelve [C/G]a cantar [Fmaj7]\nC  G/B | Am D7\nESTRIBILLO\nCantar con Am y C\n[Intro]','C','D'),'[Bm]Vuelve [D/A]a cantar [Gmaj7]\nD  A/C# | Bm E7\nESTRIBILLO\nCantar con Am y C\n[Intro]');
});
test('respeta bemoles y transposición descendente',()=>{
 assert.equal(transposeLyrics('[C] [G/B] [Am7]','C','Bb'),'[Bb] [F/A] [Gm7]');
 assert.equal(transposeLyrics('[F#m] [C#7/G#]','F#m','Em'),'[Em] [B7/F#]');
});
test('sin tono y sin acordes conserva la letra',()=>{
 assert.equal(transposeLyrics('Una letra sin acordes','C','D'),'Una letra sin acordes');
 assert.equal(transposeLyrics('[Am]Mi letra',undefined,'D'),'[Am]Mi letra');
 assert.equal(transposeLyrics('[Am]Mi letra','Am','Am'),'[Am]Mi letra');
});
test('acepta bibliotecas anteriores, tonos opcionales y sincronización con tono',()=>{
 const song={id:'1',title:'Prueba',artist:'',lyrics:'[Am]Cantar'};
 assert.ok(validateLibrary({songs:[song],order:['1']}));
 assert.ok(validateLibrary({songs:[{...song,tonality:'Am'}],order:['1']}));
 assert.ok(validCue({song:{...song,tonality:'Dbm'},stanza:0}));
 for(const tonality of ['',null,123,'H','C'.repeat(1000)])assert.equal(validateLibrary({songs:[{...song,tonality}],order:['1']}),false);
 assert.ok(validTonality('F#m'));
});
