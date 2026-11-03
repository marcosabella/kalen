export default function SyncLyricsFormat({enabled,onChange}:{enabled:boolean;onChange:(enabled:boolean)=>void}) {
 return <label className="check-setting"><input type="checkbox" checked={enabled} onChange={e=>onChange(e.target.checked)}/><span>Recibir formato de las canciones<small>Activado: colores, negrita, cursiva y subrayado del director. Desactivado: letra sin estilos. Se recuerda solo en este dispositivo y funciona por Internet y por Notebook.</small></span></label>;
}
