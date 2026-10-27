import { validTonality } from './tonality.mjs';
import { validFormats } from './lyric-format.mjs';
export const defaults = { fontSize: 26, lineHeight: 1.65, speed: 24, theme: 'dark', highContrast: true, wakeLock: false, follow: true };
export function normalizePreferences(value = {}, fallback = defaults) {
 const bounded = (v, lo, hi, d) => Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
 return {theme: value.theme === 'light' ? 'light' : 'dark',fontSize: bounded(value.fontSize,18,64,fallback.fontSize),lineHeight: bounded(value.lineHeight,1.2,2.2,fallback.lineHeight),speed: bounded(value.speed,5,90,fallback.speed),highContrast: typeof value.highContrast === 'boolean' ? value.highContrast : fallback.highContrast,wakeLock: typeof value.wakeLock === 'boolean' ? value.wakeLock : false,follow: typeof value.follow === 'boolean' ? value.follow : true};
}
export function validSong(s) {return !!s && typeof s.id === 'string' && s.id.length <= 100 && typeof s.title === 'string' && s.title.trim().length > 0 && s.title.length <= 200 && typeof s.artist === 'string' && s.artist.length <= 200 && typeof s.lyrics === 'string' && s.lyrics.length <= 100000 && validFormats(s.lyricFormats,s.lyrics.length) && (s.tonality === undefined || validTonality(s.tonality));}
export function validCue(c) {return !!c && validSong(c.song) && Number.isInteger(c.stanza) && c.stanza >= 0 && c.stanza <= 10000 && (c.fraction === undefined || Number.isFinite(c.fraction) && c.fraction >= 0 && c.fraction <= 1);}
export function validateLibrary(d) {return !!d && Array.isArray(d.songs) && d.songs.length <= 5000 && d.songs.every(validSong) && new Set(d.songs.map(s=>s.id)).size === d.songs.length && Array.isArray(d.order) && d.order.every(id=>d.songs.some(s=>s.id===id)) && new Set(d.order).size === d.order.length;}
export function stanzaList(lyrics) {return lyrics.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);}
export function applyCue(session, cue) {if (!validCue(cue)) return session; return {...session,song:cue.song,stanza:cue.stanza};}
