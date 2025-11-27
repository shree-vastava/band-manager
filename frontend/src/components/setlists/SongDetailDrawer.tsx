import React from 'react';
import {
  Drawer,
  Typography,
  Tabs,
  Tag,
  Space,
  Button,
  Empty,
  Divider,
  message
} from 'antd';
import {
  FileTextOutlined,
  CustomerServiceOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import { SongWithSetlists } from '../../types/song';
import { exportLyrics, exportChordStructure, exportLyricsWithChords } from '../../utils/pdfExport';

const { Title, Text, Paragraph } = Typography;

interface SongDetailDrawerProps {
  song: SongWithSetlists | null;
  open: boolean;
  onClose: () => void;
}

const SongDetailDrawer: React.FC<SongDetailDrawerProps> = ({ song, open, onClose }) => {
  if (!song) return null;

  const handleExportLyrics = () => {
    try {
      exportLyrics(song);
      message.success('Lyrics exported successfully!');
    } catch (error: any) {
      message.warning(error.message);
    }
  };

  const handleExportChords = () => {
    try {
      exportChordStructure(song);
      message.success('Chord structure exported successfully!');
    } catch (error: any) {
      message.warning(error.message);
    }
  };

  const handleExportLyricsWithChords = () => {
    try {
      exportLyricsWithChords(song);
      message.success('Lyrics with chords exported successfully!');
    } catch (error: any) {
      message.warning(error.message);
    }
  };

  const tabItems = [
    {
      key: 'lyrics',
      label: (
        <span>
          <FileTextOutlined />
          Lyrics
        </span>
      ),
      children: song.lyrics ? (
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.8 }}>
          {song.lyrics}
        </div>
      ) : (
        <Empty description="No lyrics added" />
      ),
    },
    {
      key: 'chords',
      label: (
        <span>
          <CustomerServiceOutlined />
          Chords
        </span>
      ),
      children: song.chord_structure ? (
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.8 }}>
          {song.chord_structure}
        </div>
      ) : (
        <Empty description="No chord structure added" />
      ),
    },
    {
      key: 'combined',
      label: (
        <span>
          <FileTextOutlined />
          Lyrics + Chords
        </span>
      ),
      children: song.lyrics_with_chords ? (
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.8 }}>
          {song.lyrics_with_chords}
        </div>
      ) : (
        <Empty description="No lyrics with chords added" />
      ),
    },
  ];

  return (
    <Drawer
      title={song.title}
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      {/* Metadata Section */}
      <Space direction="vertical" size="small" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          {song.scale && <Tag color="blue">{song.scale}</Tag>}
          {song.genre && <Tag color="green">{song.genre}</Tag>}
        </Space>

        {song.setlists.length > 0 && (
          <div>
            <Text type="secondary">In setlists: </Text>
            {song.setlists.map((setlist) => (
              <Tag key={setlist.id}>{setlist.name}</Tag>
            ))}
          </div>
        )}

        {song.description && (
          <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
            {song.description}
          </Paragraph>
        )}
      </Space>

      <Divider />

      {/* Export Buttons */}
      <div style={{ marginBottom: 16 }}>
        <Text strong>Export as PDF:</Text>
        <div style={{ marginTop: 8 }}>
          <Space wrap>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportLyrics}
              disabled={!song.lyrics}
            >
              Lyrics
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportChords}
              disabled={!song.chord_structure}
            >
              Chord Structure
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handleExportLyricsWithChords}
              disabled={!song.lyrics_with_chords}
            >
              Lyrics + Chords
            </Button>
          </Space>
        </div>
      </div>

      <Divider />

      {/* Content Tabs */}
      <Tabs defaultActiveKey="lyrics" items={tabItems} />
    </Drawer>
  );
};

export default SongDetailDrawer;