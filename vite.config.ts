import { defineConfig } from 'vite';
import { handleChordRequest } from './chords-server.mjs';
export default defineConfig({plugins:[{name:'song-chords',configureServer(server){server.middlewares.use((req,res,next)=>{void handleChordRequest(req,res).then(handled=>{if(!handled)next();}).catch(next);});}}],server:{host:'0.0.0.0'}});
