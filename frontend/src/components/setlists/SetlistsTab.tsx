import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Typography,
  Button,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Drawer,
  List,
  Tag,
  Space,
  Select,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UnorderedListOutlined
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useBand } from '../../contexts/BandContext';
import { masterSetlistService } from '../../services/masterSetlistService';
import { songService } from '../../services/songService';
import { MasterSetlist, MasterSetlistWithSongs, SongBrief } from '../../types/masterSetlist';
import { SongWithSetlists } from '../../types/song';

const { Title, Text } = Typography;
const { TextArea } = Input;

const SetlistsTab: React.FC = () => {
  const { currentBand } = useBand();
  const gridRef = useRef<AgGridReact>(null);

  // Setlists state
  const [setlists, setSetlists] = useState<MasterSetlist[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state for create/edit setlist
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState<MasterSetlist | null>(null);
  const [form] = Form.useForm();

  // Drawer state for setlist details
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<MasterSetlistWithSongs | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Add song to setlist state
  const [isAddSongModalVisible, setIsAddSongModalVisible] = useState(false);
  const [availableSongs, setAvailableSongs] = useState<SongWithSetlists[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [addingSong, setAddingSong] = useState(false);

  // Search state
  const [searchText, setSearchText] = useState('');

  // Fetch setlists when band changes
  useEffect(() => {
    if (currentBand) {
      fetchSetlists();
    }
  }, [currentBand?.id]);

  const fetchSetlists = async () => {
    if (!currentBand) return;

    setLoading(true);
    try {
      const data = await masterSetlistService.getBandSetlists(currentBand.id);
      setSetlists(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch setlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchSetlistDetails = async (setlistId: number) => {
    setDrawerLoading(true);
    try {
      const data = await masterSetlistService.getSetlistWithSongs(setlistId);
      setSelectedSetlist(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch setlist details');
    } finally {
      setDrawerLoading(false);
    }
  };

  const fetchAvailableSongs = async () => {
    if (!currentBand) return;

    try {
      const data = await songService.getBandSongs(currentBand.id);
      setAvailableSongs(data);
    } catch (error: any) {
      console.error('Failed to fetch songs:', error);
    }
  };

  // Modal handlers
  const showCreateModal = () => {
    setEditingSetlist(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (setlist: MasterSetlist) => {
    setEditingSetlist(setlist);
    form.setFieldsValue({
      name: setlist.name,
      description: setlist.description || '',
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingSetlist(null);
    form.resetFields();
  };

  const handleModalSubmit = async (values: any) => {
    if (!currentBand) return;

    setModalLoading(true);
    try {
      if (editingSetlist) {
        await masterSetlistService.updateSetlist(editingSetlist.id, {
          name: values.name,
          description: values.description || null,
        });
        message.success('Setlist updated successfully!');
      } else {
        await masterSetlistService.createSetlist({
          band_id: currentBand.id,
          name: values.name,
          description: values.description || null,
        });
        message.success('Setlist created successfully!');
      }

      await fetchSetlists();
      handleModalCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save setlist');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (setlistId: number) => {
    try {
      await masterSetlistService.deleteSetlist(setlistId);
      message.success('Setlist deleted successfully!');
      await fetchSetlists();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete setlist');
    }
  };

  // Drawer handlers
  const openDrawer = async (setlist: MasterSetlist) => {
    setIsDrawerVisible(true);
    await fetchSetlistDetails(setlist.id);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
    setSelectedSetlist(null);
  };

  // Add song handlers
  const showAddSongModal = async () => {
    await fetchAvailableSongs();
    setSelectedSongId(null);
    setIsAddSongModalVisible(true);
  };

  const handleAddSongCancel = () => {
    setIsAddSongModalVisible(false);
    setSelectedSongId(null);
  };

  const handleAddSong = async () => {
    if (!selectedSetlist || !selectedSongId) return;

    setAddingSong(true);
    try {
      await songService.addSongToSetlist(selectedSongId, selectedSetlist.id);
      message.success('Song added to setlist!');
      await fetchSetlistDetails(selectedSetlist.id);
      await fetchSetlists();
      handleAddSongCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to add song');
    } finally {
      setAddingSong(false);
    }
  };

  const handleRemoveSong = async (songId: number) => {
    if (!selectedSetlist) return;

    try {
      await songService.removeSongFromSetlist(songId, selectedSetlist.id);
      message.success('Song removed from setlist!');
      await fetchSetlistDetails(selectedSetlist.id);
      await fetchSetlists();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to remove song');
    }
  };

  // Filter songs not already in the setlist
  const getFilteredSongs = () => {
    if (!selectedSetlist) return availableSongs;
    const setlistSongIds = selectedSetlist.songs.map((s) => s.id);
    return availableSongs.filter((song) => !setlistSongIds.includes(song.id));
  };

  // Search handler
  const onSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    gridRef.current?.api?.setGridOption('quickFilterText', e.target.value);
  }, []);

  // Cell renderers
  const NameRenderer = (params: ICellRendererParams<MasterSetlist>) => {
    return (
      <Button type="link" onClick={() => openDrawer(params.data!)} style={{ padding: 0 }}>
        <Space>
          <UnorderedListOutlined />
          {params.value}
        </Space>
      </Button>
    );
  };

  const SongCountRenderer = (params: ICellRendererParams<MasterSetlist>) => {
    const count = params.data?.song_count || 0;
    return <Tag color="blue">{count} songs</Tag>;
  };

  const DescriptionRenderer = (params: ICellRendererParams<MasterSetlist>) => {
    return <Text type="secondary">{params.value || '-'}</Text>;
  };

  const ActionsRenderer = (params: ICellRendererParams<MasterSetlist>) => {
    const setlist = params.data!;
    return (
      <Space>
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => showEditModal(setlist)}
        />
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => {
            Modal.confirm({
              title: 'Delete this setlist?',
              content: 'This will not delete the songs.',
              okText: 'Delete',
              okButtonProps: { danger: true },
              onOk: () => handleDelete(setlist.id),
            });
          }}
        />
      </Space>
    );
  };

  // Column definitions
  const columnDefs: ColDef<MasterSetlist>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 2,
      sortable: true,
      filter: true,
      cellRenderer: NameRenderer,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 3,
      sortable: true,
      filter: true,
      cellRenderer: DescriptionRenderer,
    },
    {
      field: 'song_count',
      headerName: 'Songs',
      width: 120,
      sortable: true,
      cellRenderer: SongCountRenderer,
    },
    {
      headerName: 'Actions',
      width: 120,
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
        <Title level={4} style={{ margin: 0 }}>Master Setlists</Title>
        <Space>
          <Input
            placeholder="Search setlists..."
            allowClear
            onChange={onSearchChange}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
            Create Setlist
          </Button>
        </Space>
      </div>

      <div className="ag-theme-quartz" style={{ height: 600, width: '100%' }}>
        <AgGridReact
          ref={gridRef}
          rowData={setlists}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          domLayout="normal"
          animateRows={true}
          rowSelection="single"
        />
      </div>

      {/* Create/Edit Setlist Modal */}
      <Modal
        title={editingSetlist ? 'Edit Setlist' : 'Create Setlist'}
        open={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter setlist name' }]}
          >
            <Input placeholder="Enter setlist name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleModalCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={modalLoading}>
                {editingSetlist ? 'Save Changes' : 'Create Setlist'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Setlist Details Drawer */}
      <Drawer
        title={selectedSetlist?.name || 'Setlist Details'}
        placement="right"
        width={500}
        onClose={closeDrawer}
        open={isDrawerVisible}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={showAddSongModal}>
            Add Song
          </Button>
        }
      >
        {drawerLoading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin />
          </div>
        ) : selectedSetlist ? (
          <>
            {selectedSetlist.description && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">{selectedSetlist.description}</Text>
              </div>
            )}

            <Title level={5}>Songs ({selectedSetlist.songs.length})</Title>

            {selectedSetlist.songs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                No songs in this setlist
              </div>
            ) : (
              <List
                dataSource={selectedSetlist.songs}
                renderItem={(song: SongBrief, index: number) => (
                  <List.Item
                    actions={[
                      <Popconfirm
                        key="remove"
                        title="Remove from setlist?"
                        onConfirm={() => handleRemoveSong(song.id)}
                        okText="Remove"
                        cancelText="Cancel"
                      >
                        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={song.title}
                      description={
                        <Space size="small">
                          {song.scale && <Tag>{song.scale}</Tag>}
                          {song.genre && <Tag>{song.genre}</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </>
        ) : null}
      </Drawer>

      {/* Add Song to Setlist Modal */}
      <Modal
        title="Add Song to Setlist"
        open={isAddSongModalVisible}
        onCancel={handleAddSongCancel}
        onOk={handleAddSong}
        okText="Add Song"
        confirmLoading={addingSong}
        okButtonProps={{ disabled: !selectedSongId }}
      >
        <Form layout="vertical">
          <Form.Item label="Select Song">
            <Select
              placeholder="Choose a song"
              style={{ width: '100%' }}
              value={selectedSongId}
              onChange={setSelectedSongId}
              showSearch
              optionFilterProp="label"
              options={getFilteredSongs().map((song) => ({
                label: song.title,
                value: song.id,
              }))}
              notFoundContent={
                getFilteredSongs().length === 0
                  ? 'All songs are already in this setlist'
                  : 'No songs found'
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SetlistsTab;