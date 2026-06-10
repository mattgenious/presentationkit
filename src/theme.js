export const defaultPalette = {
  background: 'F6F8FC',
  surface: 'FFFFFF',
  ink: '172033',
  navy: '0B1220',
  muted: '60708A',
  faint: '93A4BC',
  line: 'D6E0ED',
  dark: '07111F',
  blue: '2563EB',
  blue2: '60A5FA',
  bluePale: 'EAF2FF',
  yellow: 'FACC15',
  yellowPale: 'FFF7CC',
  green: '22C55E',
  greenPale: 'E6FAEE',
  orange: 'F59E0B',
  orangePale: 'FFF1D6',
  purple: '4B2E83',
  purpleDark: '241140',
  white: 'FFFFFF'
};

export const defaultFonts = {
  heading: 'Aptos Display',
  body: 'Aptos'
};

export function createTheme(manifestTheme = {}) {
  return {
    fonts: {
      ...defaultFonts,
      ...(manifestTheme.fonts ?? {})
    },
    palette: {
      ...defaultPalette,
      ...(manifestTheme.palette ?? {})
    }
  };
}

export function colorForAccent(theme, accent) {
  const palette = theme.palette;
  const map = {
    blue: palette.blue,
    green: palette.green,
    yellow: palette.yellow,
    orange: palette.orange,
    purple: palette.purple
  };
  return map[accent] ?? palette.blue;
}

export function paleForAccent(theme, accent) {
  const palette = theme.palette;
  const map = {
    blue: palette.bluePale,
    green: palette.greenPale,
    yellow: palette.yellowPale,
    orange: palette.orangePale,
    purple: 'F1E8FF'
  };
  return map[accent] ?? palette.bluePale;
}
