import jsPDF from 'jspdf';
import { SongWithSetlists } from '../types/song';

const addHeader = (doc: jsPDF, song: SongWithSetlists, subtitle: string) => {
  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(song.title, 20, 25);

  // Subtitle (export type)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(subtitle, 20, 33);

  // Metadata line
  const metadata: string[] = [];
  if (song.scale) metadata.push(`Scale: ${song.scale}`);
  if (song.genre) metadata.push(`Genre: ${song.genre}`);

  if (metadata.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(metadata.join('  |  '), 20, 42);
  }

  // Divider line
  doc.setDrawColor(200);
  doc.line(20, 48, 190, 48);

  // Reset text color
  doc.setTextColor(0);

  return 55; // Return Y position after header
};

const addContent = (doc: jsPDF, content: string, startY: number) => {
  doc.setFontSize(11);
  doc.setFont('courier', 'normal');

  const pageHeight = doc.internal.pageSize.height;
  const marginBottom = 20;
  const lineHeight = 6;
  const maxWidth = 170;

  const lines = doc.splitTextToSize(content, maxWidth);
  let y = startY;

  for (const line of lines) {
    if (y + lineHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 20, y);
    y += lineHeight;
  }
};

export const exportLyrics = (song: SongWithSetlists) => {
  if (!song.lyrics) {
    throw new Error('No lyrics available for this song');
  }

  const doc = new jsPDF();
  const startY = addHeader(doc, song, 'Lyrics');
  addContent(doc, song.lyrics, startY);
  doc.save(`${song.title} - Lyrics.pdf`);
};

export const exportChordStructure = (song: SongWithSetlists) => {
  if (!song.chord_structure) {
    throw new Error('No chord structure available for this song');
  }

  const doc = new jsPDF();
  const startY = addHeader(doc, song, 'Chord Structure');
  addContent(doc, song.chord_structure, startY);
  doc.save(`${song.title} - Chords.pdf`);
};

export const exportLyricsWithChords = (song: SongWithSetlists) => {
  if (!song.lyrics_with_chords) {
    throw new Error('No lyrics with chords available for this song');
  }

  const doc = new jsPDF();
  const startY = addHeader(doc, song, 'Lyrics with Chords');
  addContent(doc, song.lyrics_with_chords, startY);
  doc.save(`${song.title} - Lyrics with Chords.pdf`);
};