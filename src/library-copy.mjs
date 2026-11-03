import { validateLibrary } from './domain.mjs';

// Keep the same JSON structure so older copies remain compatible.
/**
 * @param {import('./data').Library} library
 * @returns {import('./data').Library}
 */
export function libraryCopy(library, includeFormatting = true) {
 if (!validateLibrary(library)) throw new Error('Archivo inválido. Usá un JSON exportado desde esta aplicación.');
 return {
  songs: library.songs.map(song => {
   const { lyricFormats, ...plainSong } = song;
   return includeFormatting && lyricFormats !== undefined
    ? { ...plainSong, lyricFormats: lyricFormats.map(format => ({ ...format })) }
    : plainSong;
  }),
  order: [...library.order]
 };
}
