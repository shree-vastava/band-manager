import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  Switch
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useBand } from '../../contexts/BandContext';
import { songService } from '../../services/songService';
import { masterSetlistService } from '../../services/masterSetlistService';
import { SongWithSetlists, SongCreate, SongUpdate } from '../../types/song';
import { MasterSetlist } from '../../types/masterSetlist';
import SongDetailDrawer from './SongDetailDrawer';

const { Title } = Typography;
const { TextArea } = Input;

const SongsTab: React.FC = () => {
  const { currentBand } = useBand();
  const gridRef = useRef<AgGridReact>(null);

  // Songs state
  const [songs, setSongs] = useState<SongWithSetlists[]>([]);
  const [loading, setLoading] = useState(false);

  // Setlists for selection
  const [setlists, setSetlists] = useState<MasterSetlist[]>([]);

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingSong, setEditingSong] = useState<SongWithSetlists | null>(null);
  const [form] = Form.useForm();

  // Detail drawer state
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongWithSetlists | null>(null);

  // Fetch data when band changes
  useEffect(() => {
    if (currentBand) {
      fetchSongs();
      fetchSetlists();
    }
  }, [currentBand?.id]);

  const fetchSongs = async () => {
    if (!currentBand) return;

    setLoading(true);
    try {
      const data = await songService.getBandSongs(currentBand.id);
      setSongs(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch songs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetlists = async () => {
    if (!currentBand) return;

    try {
      const data = await masterSetlistService.getBandSetlists(currentBand.id);
      setSetlists(data);
    } catch (error: any) {
      console.error('Failed to fetch setlists:', error);
    }
  };

  // Modal handlers
  const showCreateModal = () => {
    setEditingSong(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setIsModalVisible(true);
  };

  const showEditModal = (song: SongWithSetlists) => {
    setEditingSong(song);
    form.setFieldsValue({
      title: song.title,
      description: song.description || '',
      scale: song.scale || '',
      genre: song.genre || '',
      lyrics: song.lyrics || '',
      chord_structure: song.chord_structure || '',
      lyrics_with_chords: song.lyrics_with_chords || '',
      setlist_ids: song.setlists.map((s) => s.id),
      is_active: song.is_active,
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingSong(null);
    form.resetFields();
  };

  const handleModalSubmit = async (values: any) => {
    if (!currentBand) return;

    setModalLoading(true);
    try {
      if (editingSong) {
        const updateData: SongUpdate = {
          title: values.title,
          description: values.description || null,
          scale: values.scale || null,
          genre: values.genre || null,
          lyrics: values.lyrics || null,
          chord_structure: values.chord_structure || null,
          lyrics_with_chords: values.lyrics_with_chords || null,
          is_active: values.is_active,
        };
        await songService.updateSong(editingSong.id, updateData);
        await songService.updateSongSetlists(editingSong.id, values.setlist_ids || []);
        message.success('Song updated successfully!');
      } else {
        const createData: SongCreate = {
          band_id: currentBand.id,
          title: values.title,
          description: values.description || null,
          scale: values.scale || null,
          genre: values.genre || null,
          lyrics: values.lyrics || null,
          chord_structure: values.chord_structure || null,
          lyrics_with_chords: values.lyrics_with_chords || null,
          is_active: values.is_active ?? true,
          setlist_ids: values.setlist_ids || null,
        };
        await songService.createSong(createData);
        message.success('Song created successfully!');
      }

      await fetchSongs();
      handleModalCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save song');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (songId: number) => {
    try {
      await songService.deleteSong(songId);
      message.success('Song deleted successfully!');
      await fetchSongs();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete song');
    }
  };

  const handleToggleActive = async (song: SongWithSetlists) => {
    try {
      await songService.toggleSongActive(song.id);
      message.success(`Song ${song.is_active ? 'deactivated' : 'activated'} successfully!`);
      await fetchSongs();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to update song status');
    }
  };

  // Drawer handlers
  const openDrawer = (song: SongWithSetlists) => {
    setSelectedSong(song);
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setSelectedSong(null);
  };

  // Search handler
  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    gridRef.current?.api?.setGridOption('quickFilterText', e.target.value);
  }, []);

  // Cell renderers
  const TitleRenderer = (params: ICellRendererParams<SongWithSetlists>) => {
    return (
      <Button type="link" onClick={() => openDrawer(params.data!)} style={{ padding: 0 }}>
        {params.value}
      </Button>
    );
  };

  const SetlistsRenderer = (params: ICellRendererParams<SongWithSetlists>) => {
    const song = params.data!;
    return (
      <>
        {song.setlists.length === 0 ? (
          <Tag>No Setlist</Tag>
        ) : (
          song.setlists.map((setlist) => (
            <Tag color="blue" key={setlist.id}>
              {setlist.name}
            </Tag>
          ))
        )}
      </>
    );
  };

  const ActiveRenderer = (params: ICellRendererParams<SongWithSetlists>) => {
    const song = params.data!;
    return (
      <Switch
        checked={song.is_active}
        onChange={() => handleToggleActive(song)}
        checkedChildren="Active"
        unCheckedChildren="Inactive"
      />
    );
  };

  const ActionsRenderer = (params: ICellRendererParams<SongWithSetlists>) => {
    const song = params.data!;
    return (
      <Space>
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(song)}
        />
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => showEditModal(song)}
        />
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Delete this song?',
              content: 'This action cannot be undone.',
              okText: 'Delete',
              okButtonProps: { danger: true },
              onOk: () => handleDelete(song.id),
            });
          }}
        />
      </Space>
    );
  };

  // Column definitions
  const columnDefs: ColDef<SongWithSetlists>[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: TitleRenderer,
    },
    {
      field: 'scale',
      headerName: 'Scale',
      flex: 1,
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'genre',
      headerName: 'Genre',
      flex: 1,
      sortable: true,
      filter: true,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Setlists',
      flex: 2,
      cellRenderer: SetlistsRenderer,
      valueGetter: (params) => params.data?.setlists.map((s) => s.name).join(', ') || '',
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 120,
      cellRenderer: ActiveRenderer,
    },
    {
      headerName: 'Actions',
      width: 140,
      cellRenderer: ActionsRenderer,
      sortable: false,
      filter: false,
    },
  ];

  const defaultColDef: ColDef = {
    resizable: true,
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>All Songs</Title>
        <Space>
          <Input
            placeholder="Search songs..."
            allowClear
            onChange={onSearchChange}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Add Song
          </Button>
        </Space>
      </div>

      <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={songs}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          domLayout="normal"
          animateRows={true}
          rowSelection="single"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSong ? 'Edit Song' : 'Add Song'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter song title' }]}
          >
            <Input placeholder="Enter song title" />
          </Form.Item>

          <Space style={{ width: '100%' }} size="middle">
            <Form.Item
              name="scale"
              label="Scale"
              style={{ width: 200 }}
            >
              <Input placeholder="e.g., C Major" />
            </Form.Item>

            <Form.Item
              name="genre"
              label="Genre"
              style={{ width: 200 }}
            >
              <Input placeholder="e.g., Rock" />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Space>

          <Form.Item
            name="setlist_ids"
            label="Setlists"
          >
            <Select
              mode="multiple"
              placeholder="Select setlists (optional)"
              allowClear
              options={setlists.map((s) => ({ label: s.name, value: s.id }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={2} placeholder="Optional description" />
          </Form.Item>

          <Form.Item
            name="lyrics"
            label="Lyrics"
          >
            <TextArea rows={4} placeholder="Song lyrics" />
          </Form.Item>

          <Form.Item
            name="chord_structure"
            label="Chord Structure"
          >
            <TextArea rows={2} placeholder="e.g., Am - G - F - E" />
          </Form.Item>

          <Form.Item
            name="lyrics_with_chords"
            label="Lyrics with Chords"
          >
            <TextArea rows={4} placeholder="Lyrics with chord annotations" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleModalCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={modalLoading}>
                {editingSong ? 'Save Changes' : 'Add Song'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Song Detail Drawer */}
      <SongDetailDrawer
        song={selectedSong}
        open={isDrawerVisible}
        onClose={closeDrawer}
      />
    </div>
  );
};

export default SongsTab;