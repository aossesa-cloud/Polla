/**
 * ExportStylesMockup.jsx
 * 
 * Página de demostración con TODOS los estilos disponibles para exportación PNG.
 * Abre esta URL: http://localhost:5173/export-mockup
 */

import React from 'react'

// Datos de ejemplo (mismos picks que tienes en el sistema)
const DEMO_PICKS = [
  { participant: 'ROMATRI', picks: ['4', '7', '4', '11', '2', '3', '8', '7', '3', '12', '4', '3', '1', '12', '12', '12', '2'], score: 27.7, dividendos: ['', '', '', '4,2', '2,2', '', '', '', '', '', '', '', '4,8', '6,7', '', '', '9,8'] },
  { participant: 'MANZANA', picks: ['3', '9', '2', '9', '2', '2', '12', '8', '1', '11', '6', '8', '5', '2', '1', '6', '12', '3'], score: 33.1, dividendos: ['', '', '6,3', '', '2,2', '1,8', '', '5,5', '', '', '', '', '3,1', '', '1,2', '', '10', '3'] },
  { participant: 'NANO', picks: ['15', '6', '6', '12', '2', '3', '12', '6', '3', '6', '9', '8', '6', '5', '6', '3', '2', '5'], score: 20.9, dividendos: ['3,4', '2,8', '', '', '2,2', '', '', '', '', '', '', '', '', '', '1,2', '', '4,9', '6,4'] },
  { participant: 'TOCOCO', picks: ['9', '2', '2', '6', '2', '6', '12', '6', '6', '6', '6', '2', '6', '10', '10', '3', '2', '2'], score: 53.6, dividendos: ['1,8', '3,8', '6,3', '', '2,2', '5,2', '', '', '', '', '', '', '', '', '', '4,9', '6,4', '9,8'] },
]

const NUM_RACES = 18

// ===== ESTILO 1: Excel Clásico (el que ya implementé) =====
function StyleExcelClassic({ picks }) {
  return (
    <div style={{ background: '#FFF', padding: '15px', fontFamily: 'Arial', maxWidth: '1200px' }}>
      <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#1F4E79', marginBottom: '12px' }}>
        🏇 Tabla de Pronósticos
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '13px', fontWeight: 'bold' }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th style={{ width: '40px', background: '#1F4E79', color: '#FFF', padding: '8px 6px', border: '1px solid #1F4E79', textAlign: 'center' }}>N°</th>
            <th style={{ width: '140px', background: '#1F4E79', color: '#FFF', padding: '8px 10px', border: '1px solid #1F4E79', textAlign: 'left' }}>STUD</th>
            <th style={{ width: '75px', background: '#1F4E79', color: '#FFF', padding: '8px 6px', border: '1px solid #1F4E79', textAlign: 'center' }}>Pts</th>
            {Array.from({ length: NUM_RACES }, (_, i) => (
              <th key={i} style={{ width: '60px', background: '#1F4E79', color: '#FFF', padding: '8px 4px', border: '1px solid #1F4E79', textAlign: 'center' }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.map((entry, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ background: '#1F4E79', color: '#FFF', padding: '4px 6px', border: '1px solid #1F4E79', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ background: '#FFF', padding: '4px 10px', border: '1px solid #D9D9D9', whiteSpace: 'nowrap' }}>{entry.participant}</td>
                <td style={{ background: '#FFF', padding: '4px 6px', border: '1px solid #D9D9D9', textAlign: 'center', color: '#1F4E79', fontSize: '15px' }}>{entry.score}</td>
                {entry.picks.map((pick, i) => (
                  <td key={i} style={{ background: pick ? '#F4B183' : '#FFF', padding: '4px 6px', border: `1px solid ${pick ? '#E8913A' : '#D9D9D9'}`, textAlign: 'center' }}>{pick}</td>
                ))}
              </tr>
              <tr>
                <td style={{ background: '#FFF', border: '1px solid #D9D9D9', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #D9D9D9', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #D9D9D9', padding: 0 }}></td>
                {entry.dividendos.map((div, i) => (
                  <td key={i} style={{ background: div ? '#2F5496' : '#FFF', padding: '4px 6px', border: `1px solid ${div ? '#2F5496' : '#D9D9D9'}`, textAlign: 'center', color: div ? '#FFF' : 'transparent', fontSize: '12px' }}>{div}</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== ESTILO 2: Minimalista Blanco =====
function StyleMinimalWhite({ picks }) {
  return (
    <div style={{ background: '#FFF', padding: '15px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '15px', borderBottom: '2px solid #333', paddingBottom: '8px' }}>
        TABLA DE PRONÓSTICOS
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th style={{ padding: '8px', border: '1px solid #000', background: '#E0E0E0', textAlign: 'center', fontWeight: 'bold' }}>N°</th>
            <th style={{ padding: '8px', border: '1px solid #000', background: '#E0E0E0', textAlign: 'left', fontWeight: 'bold' }}>STUD</th>
            <th style={{ padding: '8px', border: '1px solid #000', background: '#E0E0E0', textAlign: 'center', fontWeight: 'bold' }}>PTS</th>
            {Array.from({ length: NUM_RACES }, (_, i) => (
              <th key={i} style={{ padding: '6px', border: '1px solid #000', background: '#E0E0E0', textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.map((entry, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ padding: '6px', border: '1px solid #CCC', textAlign: 'center', fontWeight: 'bold', background: '#FAFAFA' }}>{idx + 1}</td>
                <td style={{ padding: '6px 10px', border: '1px solid #CCC', fontWeight: 'bold', fontSize: '13px' }}>{entry.participant}</td>
                <td style={{ padding: '6px', border: '1px solid #CCC', textAlign: 'center', fontWeight: 'bold', color: '#333', fontSize: '14px' }}>{entry.score}</td>
                {entry.picks.map((pick, i) => (
                  <td key={i} style={{ padding: '6px', border: '1px solid #CCC', textAlign: 'center', fontWeight: 'bold', background: pick ? '#FFE5B4' : '#FFF', fontSize: '14px' }}>{pick}</td>
                ))}
              </tr>
              <tr>
                <td style={{ border: '1px solid #CCC', padding: 0 }}></td>
                <td style={{ border: '1px solid #CCC', padding: 0 }}></td>
                <td style={{ border: '1px solid #CCC', padding: 0 }}></td>
                {entry.dividendos.map((div, i) => (
                  <td key={i} style={{ padding: '5px', border: '1px solid #CCC', textAlign: 'center', background: div ? '#4472C4' : '#FFF', color: div ? '#FFF' : 'transparent', fontWeight: 'bold', fontSize: '11px' }}>{div}</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== ESTILO 3: Compacto Dense =====
function StyleCompactDense({ picks }) {
  return (
    <div style={{ background: '#FFF', padding: '10px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#1F4E79', marginBottom: '8px' }}>
        🏇 PRONÓSTICOS DEL DÍA
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '11px' }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th style={{ width: '30px', background: '#2C5282', color: '#FFF', padding: '5px 4px', border: '1px solid #2C5282', textAlign: 'center' }}>#</th>
            <th style={{ width: '110px', background: '#2C5282', color: '#FFF', padding: '5px 8px', border: '1px solid #2C5282', textAlign: 'left' }}>STUD</th>
            <th style={{ width: '55px', background: '#2C5282', color: '#FFF', padding: '5px 4px', border: '1px solid #2C5282', textAlign: 'center' }}>PTS</th>
            {Array.from({ length: NUM_RACES }, (_, i) => (
              <th key={i} style={{ width: '45px', background: '#2C5282', color: '#FFF', padding: '5px 3px', border: '1px solid #2C5282', textAlign: 'center', fontSize: '12px' }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.map((entry, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ background: '#2C5282', color: '#FFF', padding: '3px 4px', border: '1px solid #2C5282', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ background: '#FFF', padding: '3px 8px', border: '1px solid #CBD5E0', fontWeight: 'bold', fontSize: '12px' }}>{entry.participant}</td>
                <td style={{ background: '#FFF', padding: '3px 4px', border: '1px solid #CBD5E0', textAlign: 'center', fontWeight: 'bold', color: '#2C5282' }}>{entry.score}</td>
                {entry.picks.map((pick, i) => (
                  <td key={i} style={{ background: pick ? '#F6AD55' : '#FFF', padding: '3px 4px', border: `1px solid ${pick ? '#DD6B20' : '#CBD5E0'}`, textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>{pick}</td>
                ))}
              </tr>
              <tr>
                <td style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #CBD5E0', padding: 0 }}></td>
                {entry.dividendos.map((div, i) => (
                  <td key={i} style={{ background: div ? '#4299E1' : '#FFF', padding: '3px 4px', border: `1px solid ${div ? '#4299E1' : '#CBD5E0'}`, textAlign: 'center', color: div ? '#FFF' : 'transparent', fontWeight: 'bold', fontSize: '10px' }}>{div}</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== ESTILO 4: Azul Oscuro Premium =====
function StyleBluePremium({ picks }) {
  return (
    <div style={{ background: '#1E3A5F', padding: '15px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#FFF', marginBottom: '12px', letterSpacing: '1px' }}>
        🏇 PRONÓSTICOS
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '13px' }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th style={{ width: '40px', background: '#0F2940', color: '#64B5F6', padding: '8px 6px', border: '1px solid #37474F', textAlign: 'center', fontWeight: 'bold' }}>N°</th>
            <th style={{ width: '140px', background: '#0F2940', color: '#64B5F6', padding: '8px 10px', border: '1px solid #37474F', textAlign: 'left', fontWeight: 'bold' }}>STUD</th>
            <th style={{ width: '75px', background: '#0F2940', color: '#64B5F6', padding: '8px 6px', border: '1px solid #37474F', textAlign: 'center', fontWeight: 'bold' }}>PTS</th>
            {Array.from({ length: NUM_RACES }, (_, i) => (
              <th key={i} style={{ width: '60px', background: '#0F2940', color: '#64B5F6', padding: '8px 4px', border: '1px solid #37474F', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.map((entry, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ background: '#142E44', color: '#FFF', padding: '5px 6px', border: '1px solid #37474F', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ background: '#1A3A54', padding: '5px 10px', border: '1px solid #37474F', color: '#FFF', fontWeight: 'bold', fontSize: '14px' }}>{entry.participant}</td>
                <td style={{ background: '#1A3A54', padding: '5px 6px', border: '1px solid #37474F', textAlign: 'center', color: '#FFB74D', fontWeight: 'bold', fontSize: '15px' }}>{entry.score}</td>
                {entry.picks.map((pick, i) => (
                  <td key={i} style={{ background: pick ? '#FF8F00' : '#1A3A54', padding: '5px 6px', border: `1px solid ${pick ? '#FF8F00' : '#37474F'}`, textAlign: 'center', color: pick ? '#FFF' : '#90A4AE', fontWeight: 'bold', fontSize: '14px' }}>{pick}</td>
                ))}
              </tr>
              <tr>
                <td style={{ background: '#142E44', border: '1px solid #37474F', padding: 0 }}></td>
                <td style={{ background: '#1A3A54', border: '1px solid #37474F', padding: 0 }}></td>
                <td style={{ background: '#1A3A54', border: '1px solid #37474F', padding: 0 }}></td>
                {entry.dividendos.map((div, i) => (
                  <td key={i} style={{ background: div ? '#1565C0' : '#1A3A54', padding: '5px 6px', border: `1px solid ${div ? '#1565C0' : '#37474F'}`, textAlign: 'center', color: div ? '#BBDEFB' : 'transparent', fontWeight: 'bold', fontSize: '12px' }}>{div}</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== ESTILO 5: Tabla de Carrera (Colores Hipódromo) =====
function StyleHipodromo({ picks }) {
  const hipodromoColors = {
    header: '#8B0000', // Rojo oscuro (pista)
    picks: '#FFD700',  // Dorado (ganador)
    dividendos: '#1B5E20', // Verde oscuro (dinero)
  }

  return (
    <div style={{ background: '#FFF', padding: '15px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px' }}>
      <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#8B0000', marginBottom: '12px', borderBottom: '3px solid #8B0000', paddingBottom: '8px' }}>
        🐎 PRONÓSTICOS - HIPÓDROMO
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '13px' }} cellPadding="0" cellSpacing="0">
        <thead>
          <tr>
            <th style={{ width: '40px', background: '#8B0000', color: '#FFF', padding: '8px 6px', border: '1px solid #8B0000', textAlign: 'center', fontWeight: 'bold' }}>N°</th>
            <th style={{ width: '140px', background: '#8B0000', color: '#FFF', padding: '8px 10px', border: '1px solid #8B0000', textAlign: 'left', fontWeight: 'bold' }}>STUD</th>
            <th style={{ width: '75px', background: '#8B0000', color: '#FFF', padding: '8px 6px', border: '1px solid #8B0000', textAlign: 'center', fontWeight: 'bold' }}>PTS</th>
            {Array.from({ length: NUM_RACES }, (_, i) => (
              <th key={i} style={{ width: '60px', background: '#8B0000', color: '#FFF', padding: '8px 4px', border: '1px solid #8B0000', textAlign: 'center', fontWeight: 'bold' }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.map((entry, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td style={{ background: '#FFEBEE', color: '#8B0000', padding: '5px 6px', border: '1px solid #E57373', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                <td style={{ background: '#FFF', padding: '5px 10px', border: '1px solid #E57373', fontWeight: 'bold', fontSize: '14px' }}>{entry.participant}</td>
                <td style={{ background: '#FFF', padding: '5px 6px', border: '1px solid #E57373', textAlign: 'center', color: '#8B0000', fontWeight: 'bold', fontSize: '15px' }}>{entry.score}</td>
                {entry.picks.map((pick, i) => (
                  <td key={i} style={{ background: pick ? '#FFD700' : '#FFF', padding: '5px 6px', border: `1px solid ${pick ? '#FFA000' : '#E57373'}`, textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: '#000' }}>{pick}</td>
                ))}
              </tr>
              <tr>
                <td style={{ background: '#FFEBEE', border: '1px solid #E57373', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #E57373', padding: 0 }}></td>
                <td style={{ background: '#FFF', border: '1px solid #E57373', padding: 0 }}></td>
                {entry.dividendos.map((div, i) => (
                  <td key={i} style={{ background: div ? '#1B5E20' : '#FFF', padding: '5px 6px', border: `1px solid ${div ? '#1B5E20' : '#E57373'}`, textAlign: 'center', color: div ? '#FFF' : 'transparent', fontWeight: 'bold', fontSize: '12px' }}>{div}</td>
                ))}
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== PÁGINA PRINCIPAL DE MOCKUPS =====
export default function ExportStylesMockup() {
  const styles = [
    { id: 'excel', name: '1. Excel Clásico (Recomendado)', component: StyleExcelClassic, desc: 'Fondo blanco, header azul, picks naranjas, dividendos azules. Ideal para WhatsApp.' },
    { id: 'minimal', name: '2. Minimalista Blanco', component: StyleMinimalWhite, desc: 'Ultra limpio, bordes finos, colores suaves. Estilo Excel moderno.' },
    { id: 'compact', name: '3. Compacto Dense', component: StyleCompactDense, desc: 'Más compacto, celdas pequeñas. Más filas visibles en pantalla.' },
    { id: 'premium', name: '4. Azul Oscuro Premium', component: StyleBluePremium, desc: 'Fondo oscuro elegante. Para pantallas y presentaciones.' },
    { id: 'hipodromo', name: '5. Hipódromo Clásico', component: StyleHipodromo, desc: 'Rojo y dorado. Estilo tradicional de hipódromos.' },
  ]

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '10px' }}>
        📊 Estilos de Exportación PNG
      </h1>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
        Haz click en el estilo que prefieras para aplicarlo al sistema
      </p>

      {styles.map(({ id, name, component: Component, desc }) => (
        <div key={id} style={{ marginBottom: '40px', background: '#FFF', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: '#1F4E79' }}>{name}</h2>
            <button
              onClick={() => alert(`Estilo "${name}" seleccionado. ¿Quieres aplicarlo?`)}
              style={{
                padding: '10px 20px',
                background: '#1F4E79',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ✅ Usar este estilo
            </button>
          </div>
          <p style={{ color: '#666', marginBottom: '15px', fontStyle: 'italic' }}>{desc}</p>
          <div style={{ overflow: 'auto', maxWidth: '100%' }}>
            <Component picks={DEMO_PICKS} />
          </div>
        </div>
      ))}
    </div>
  )
}
