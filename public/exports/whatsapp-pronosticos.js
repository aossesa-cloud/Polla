/**
 * WhatsApp Pronosticos Export Module - V3 HD
 * 
 * Usa tablas HTML reales (más estables que CSS Grid para html-to-image)
 * Genera imágenes HD con alta resolución para WhatsApp.
 */

export class WhatsAppPicksExporter {
  constructor(options = {}) {
    this.baseWidth = options.width || 1080;
    this.padding = options.padding || 32;
    this.pixelRatio = options.pixelRatio || 3;
    this.theme = options.theme || 'daily'; // daily, weekly, monthly
    
    // Colores por tema
    this.themeColors = {
      daily: {
        header: '#fef3c7',
        headerText: '#92400e',
        raceHeader: '#78350f',
        scoreHigh: '#166534',
        scoreMid: '#a16207',
        scoreLow: '#b45309',
        accent: '#d97706',
      },
      weekly: {
        header: '#dbeafe',
        headerText: '#1e40af',
        raceHeader: '#1e3a8a',
        scoreHigh: '#166534',
        scoreMid: '#1d4ed8',
        scoreLow: '#dc2626',
        accent: '#2563eb',
      },
      monthly: {
        header: '#dcfce7',
        headerText: '#166534',
        raceHeader: '#14532d',
        scoreHigh: '#15803d',
        scoreMid: '#059669',
        scoreLow: '#0d9488',
        accent: '#10b981',
      }
    };
    
    const themeColor = this.themeColors[this.theme] || this.themeColors.daily;
    
    this.calculateWidth = (raceCount) => {
      const minWidthPerRace = 70;
      const fixedColumns = 500;
      const racesWidth = raceCount * minWidthPerRace;
      return Math.max(this.baseWidth, fixedColumns + racesWidth);
    };
    
    this.colors = {
      background: '#f8fafc',
      header: themeColor.header,
      headerText: themeColor.headerText,
      studBg: '#ffffff',
      studAlt: '#f9fafb',
      cellBg: '#ffffff',
      cellBorder: '#d1d5db',
      scoreHigh: themeColor.scoreHigh,
      scoreMid: themeColor.scoreMid,
      scoreLow: themeColor.scoreLow,
      scoreZero: '#6b7280',
      raceHeader: themeColor.raceHeader,
      numberBold: '#111827',
      horseName: '#6b7280',
      withdrawn: '#ef4444',
      accent: themeColor.accent,
    };
  }

  async generateImage(data) {
    this.width = this.calculateWidth(data.races.length);
    
    console.log('📱 Generando imagen HD...', {
      title: data.title,
      races: data.races.length,
      studs: data.studs.length,
      width: this.width,
      pixelRatio: this.pixelRatio,
      totalPicks: data.studs.reduce((sum, s) => sum + s.picks.length, 0)
    });

    const node = this.buildExportNode(data);
    document.body.appendChild(node);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => requestAnimationFrame(resolve));
      await new Promise(resolve => setTimeout(resolve, 200)); // Esperar más para HD

      const rect = node.getBoundingClientRect();
      console.log('📐 Dimensiones:', {
        width: rect.width,
        height: rect.height,
        scrollWidth: node.scrollWidth,
        scrollHeight: node.scrollHeight
      });

      const blob = await this.captureNode(node);
      console.log('✅ Imagen HD generada:', {
        size: (blob.size / 1024).toFixed(2) + ' KB',
        type: blob.type
      });
      return blob;
    } catch (error) {
      console.error('❌ Error generando imagen:', error);
      throw error;
    } finally {
      node.remove();
    }
  }

  /**
   * Construye el nodo usando TABLAS HTML reales (más estables que Grid)
   */
  buildExportNode(data) {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${this.width}px;
      background: ${this.colors.background};
      padding: ${this.padding}px;
      box-sizing: border-box;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 99999;
    `;

    // Header
    const pageHeader = document.createElement('div');
    pageHeader.style.cssText = `margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid ${this.colors.raceHeader};`;
    pageHeader.innerHTML = `
      <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 800; color: ${this.colors.headerText};">${data.title}</h1>
      <p style="margin: 0; font-size: 20px; color: ${this.colors.horseName};">📅 ${data.date} · 🏇 ${data.track} · ${data.studs.length} participantes · ${data.races.length} carreras</p>
    `;
    container.appendChild(pageHeader);

    // Tabla principal
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      table-layout: fixed;
    `;

    // Header de carreras
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.background = this.colors.header;

    ['N', 'STUD', 'TOTAL'].forEach((label, idx) => {
      const th = document.createElement('th');
      const colWidth = idx === 0 ? '40px' : idx === 1 ? '200px' : '60px';
      th.style.cssText = `
        padding: 12px 8px;
        font-size: 16px;
        font-weight: 900;
        color: ${this.colors.raceHeader};
        text-align: center;
        border: 1px solid ${this.colors.cellBorder};
        vertical-align: middle;
        width: ${colWidth};
      `;
      th.textContent = label;
      headerRow.appendChild(th);
    });

    data.races.forEach(race => {
      const th = document.createElement('th');
      th.style.cssText = `
        padding: 12px 4px;
        font-size: 16px;
        font-weight: 800;
        color: ${this.colors.raceHeader};
        text-align: center;
        border: 1px solid ${this.colors.cellBorder};
        vertical-align: middle;
        white-space: nowrap;
      `;
      th.textContent = `C${race.raceNumber}`;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Filas de studs
    const tbody = document.createElement('tbody');
    data.studs.forEach((stud, index) => {
      const row = document.createElement('tr');
      row.style.background = index % 2 === 0 ? this.colors.studBg : this.colors.studAlt;

      // Número
      const numCell = document.createElement('td');
      numCell.style.cssText = `
        padding: 8px;
        font-size: 16px;
        font-weight: 800;
        color: ${this.colors.numberBold};
        text-align: center;
        border: 1px solid ${this.colors.cellBorder};
        vertical-align: middle;
        width: 40px;
      `;
      numCell.textContent = stud.index || (index + 1);
      row.appendChild(numCell);

      // Nombre - Full visibility, bold and clear
      const nameCell = document.createElement('td');
      nameCell.style.cssText = `
        padding: 8px 6px;
        font-size: 14px;
        font-weight: 900;
        color: #1a1a1a;
        border: 1px solid ${this.colors.cellBorder};
        vertical-align: middle;
        text-align: left;
        min-width: 200px;
        max-width: 200px;
        width: 200px;
      `;
      nameCell.textContent = stud.name;
      row.appendChild(nameCell);

      // Total
      const totalCell = document.createElement('td');
      const totalScore = stud.totalScore || 0;
      totalCell.style.cssText = `
        padding: 8px;
        font-size: 16px;
        font-weight: 800;
        color: ${totalScore > 50 ? this.colors.scoreHigh : totalScore > 20 ? this.colors.scoreMid : this.colors.scoreLow};
        text-align: center;
        border: 1px solid ${this.colors.cellBorder};
        vertical-align: middle;
        min-width: 60px;
        white-space: nowrap;
      `;
      totalCell.textContent = totalScore;
      row.appendChild(totalCell);

      // Picks
      for (let i = 0; i < data.races.length; i++) {
        const pick = stud.picks.find(p => p.raceNumber === (i + 1));
        
        // Color de fondo según dividendo
        const getCellBgColor = (score) => {
          if (!score || score === 0) return '#f9fafb';
          if (score >= 15) return '#dcfce7';    // Verde claro - dividendo alto
          if (score >= 8) return '#d9f99d';     // Amarillo-verde - bien
          if (score >= 3) return '#fef08a';     // Amarillo - medio
          if (score >= 1) return '#fed7aa';     // Naranja claro - bajo
          return '#f3f4f6';                     // Gris - cero
        };
        
        const pickCell = document.createElement('td');
        pickCell.style.cssText = `
          padding: 4px 2px;
          text-align: center;
          border: 1px solid ${this.colors.cellBorder};
          vertical-align: middle;
          min-width: 50px;
          max-width: 70px;
        `;

        // Función para limpiar nombre de caballo (sacar paréntesis)
        const cleanHorseName = (name) => {
          if (!name) return '';
          return name.replace(/\s*\(.*?\)\s*/g, '').trim();
        };

        if (pick) {
          const cleanName = cleanHorseName(pick.horseName);
          const cellBg = getCellBgColor(pick.score);
          
          // Redondear score para evitar errores de punto flotante
          const roundedScore = Math.round((pick.score || 0) * 10) / 10;
          
          pickCell.style.background = cellBg;
          pickCell.innerHTML = `
            <div style="font-size: 15px; font-weight: 800; color: ${this.colors.numberBold}; line-height: 1.3; white-space: nowrap;">
              ${pick.pick || '-'} <span style="color: ${pick.score >= 3 ? this.colors.scoreHigh : this.colors.scoreZero}; font-size: 13px;">- ${roundedScore}</span>
            </div>
            ${cleanName ? `<div style="font-size: 9px; color: ${this.colors.horseName}; line-height: 1.2; margin-top: 2px; white-space: normal; word-wrap: break-word; overflow-wrap: anywhere; max-width: 100%; font-weight: 600;">${cleanName}</div>` : ''}
          `;
        } else {
          pickCell.style.background = '#f3f4f6';
          pickCell.innerHTML = `<div style="color: ${this.colors.scoreZero}; opacity: 0.4; font-size: 14px;">-</div>`;
        }
        row.appendChild(pickCell);
      }

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
    return container;
  }

  async captureNode(node) {
    if (!window.htmlToImage) {
      throw new Error('html-to-image no esta disponible');
    }

    console.log('📸 Iniciando captura HD...');

    const blob = await window.htmlToImage.toBlob(node, {
      cacheBust: true,
      pixelRatio: this.pixelRatio, // HD: 3x
      backgroundColor: this.colors.background,
      width: node.scrollWidth,
      height: node.scrollHeight,
    });

    if (!blob) {
      throw new Error('No se pudo generar la imagen');
    }

    console.log('📸 Captura HD completada:', blob.size, 'bytes');
    return blob;
  }

  async downloadImage(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async shareImage(blob, filename) {
    const file = new File([blob], `${filename}.png`, { type: 'image/png' });
    
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    await this.downloadImage(blob, filename);
  }

  static extractEventData(event, theme = 'daily', program = null) {
    const title = event?.campaign?.name || event?.sheetName || 'Pronósticos registrados';
    const date = event?.date || new Date().toISOString().split('T')[0];
    const track = event?.trackName || event?.trackId || 'Hipódromo';
    const raceCount = event?.races || 0;
    
    console.log('🔍 Programa recibido:', {
      hasProgram: !!program,
      programKeys: program ? Object.keys(program) : [],
      programRaces: program?.races ? Object.keys(program.races) : [],
      firstRace: program?.races ? program.races[Object.keys(program.races)[0]] : null
    });
    
    // Función para obtener nombre del caballo desde el programa
    const getRunnerName = (raceNumber, horseNumber) => {
      if (!program || !raceNumber || !horseNumber || horseNumber === '-') return '';
      
      // Buscar la carrera en el programa (puede ser string o número)
      const raceKey = String(raceNumber);
      const race = program.races?.[raceKey] || program.races?.[raceNumber] || null;
      
      if (!race) {
        console.log(`⚠️ Carrera ${raceNumber} no encontrada en programa`);
        return '';
      }
      
      // El programa puede tener 'entries' o 'runners'
      const runners = race.entries || race.runners || [];
      
      const normalizeRunnerNumber = (value) => String(value || '').trim().replace(/^0+(\d)/, '$1').toUpperCase();
      const targetNumber = normalizeRunnerNumber(horseNumber);
      
      const target = runners.find(entry => {
        const entryNumber = normalizeRunnerNumber(entry.number);
        return entryNumber === targetNumber || String(Number(entry.number) || '').trim() === String(Number(horseNumber) || '').trim();
      });
      
      const name = String(target?.name || target?.horseName || '').trim();
      
      if (name) {
        console.log(`✅ C${raceNumber} Caballo ${horseNumber} → ${name}`);
      }
      
      return name;
    };

    const races = [];
    for (let i = 1; i <= raceCount; i++) {
      races.push({ raceNumber: i });
    }

    const studs = (event?.participants || []).map((participant, index) => {
      const picks = (participant.picks || []).map((pick, pickIndex) => {
        const raceNumber = pick.raceNumber || (pickIndex + 1);
        const horseNumber = pick.horse || pick.number || '-';
        
        // Obtener nombre del caballo desde el programa
        const horseName = horseNumber !== '-' ? getRunnerName(raceNumber, horseNumber) : '';

        return {
          raceNumber: raceNumber,
          pick: horseNumber,
          horseName: horseName,
          score: pick.score || 0,
          withdrawn: pick.withdrawn || false,
        };
      });

      return {
        index: participant.index || (index + 1),
        name: participant.name,
        totalScore: participant.points || participant.totalScore || 0,
        picks,
      };
    });

    console.log('🔍 Primer stud extraído:', {
      name: studs[0]?.name,
      picksCount: studs[0]?.picks?.length,
      firstThreePicks: studs[0]?.picks?.slice(0, 3)
    });

    return { title, date, track, races, studs, theme };
  }
}

if (typeof window !== 'undefined') {
  window.WhatsAppPicksExporter = WhatsAppPicksExporter;
}
