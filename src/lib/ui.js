import ora from 'ora';
import chalk from 'chalk';

// Brutalist block spinner
export const brutalistSpinner = {
  interval: 100,
  frames: [
    '▌       ',
    '█▌      ',
    '██▌     ',
    '███▌    ',
    '████▌   ',
    '█████▌  ',
    '██████▌ ',
    '███████▌',
    '███████ ',
    '██████  ',
    '█████   ',
    '████    ',
    '███     ',
    '██      ',
    '█       '
  ]
};

// Creates a stylized ora spinner
export function createSpinner(text) {
  return ora({
    text: chalk.bold(text),
    spinner: brutalistSpinner,
    color: 'white',
    stream: process.stderr
  });
}

// Simple delay function
export const delay = ms => new Promise(res => setTimeout(res, ms));

// Glitch effect text - writes a line to stderr
export async function glitchPrint(text) {
  if (!process.stderr.isTTY) {
    process.stderr.write(text + '\n');
    return;
  }
  
  const chars = '!<>-_\\\\/[]{}—=+*^?#_';
  const iters = 15;
  const speed = 25;
  
  for (let i = 0; i <= text.length; i++) {
    const revealed = text.slice(0, i);
    const hidden = text.slice(i).replace(/[^\s]/g, () => chars[Math.floor(Math.random() * chars.length)]);
    
    process.stderr.write('\x1b[2K\r' + chalk.bold(revealed) + chalk.dim(hidden));
    await delay(speed);
  }
  process.stderr.write('\n');
}
