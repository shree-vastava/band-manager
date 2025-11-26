import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Row, Col, Tag, Empty, Spin, message, Modal, Form, Input, DatePicker, TimePicker, Select, InputNumber, Upload, Drawer, Descriptions, Popconfirm, List, Divider, Alert } from 'antd';
import { PlusOutlined, CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, UploadOutlined, DeleteOutlined, EditOutlined, DollarOutlined, TeamOutlined } from '@ant-design/icons';
import { useBand } from '../contexts/BandContext';
import { showService } from '../services/showService';
import { bandMemberService } from '../services/bandMemberService';
import { Show, ShowCreate, ShowUpdate, ShowStatus, ShowPayment, ShowPaymentCreate } from '../types/show';
import { BandMember } from '../types/bandMember';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusColors: Record<ShowStatus, string> = {
  [ShowStatus.UPCOMING]: 'blue',
  [ShowStatus.CANCELLED]: 'red',
  [ShowStatus.DONE]: 'green',
  [ShowStatus.COMPLETE_PAYMENT_RECEIVED]: 'gold',
};

const Shows: React.FC = () => {
  const { currentBand } = useBand();
  
  // Shows state
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state for create/edit
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  
  // Drawer state for show details
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  
  // Band members for selection
  const [bandMembers, setBandMembers] = useState<BandMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // Payment state (for edit modal)
  const [payments, setPayments] = useState<ShowPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentAmount, setNewPaymentAmount] = useState<number | null>(null);
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [addingPayment, setAddingPayment] = useState(false);
  
  // Track selected status in form
  const [selectedStatus, setSelectedStatus] = useState<ShowStatus>(ShowStatus.UPCOMING);
  
  // Original status when editing (to detect status change)
  const [originalStatus, setOriginalStatus] = useState<ShowStatus | null>(null);

  // Fetch shows when band changes
  useEffect(() => {
    if (currentBand) {
      fetchShows();
      fetchBandMembers();
    }
  }, [currentBand?.id]);

  const fetchShows = async () => {
    if (!currentBand) return;
    
    setLoading(true);
    try {
      const data = await showService.getBandShows(currentBand.id);
      setShows(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch shows');
    } finally {
      setLoading(false);
    }
  };

  const fetchBandMembers = async () => {
    if (!currentBand) return;
    
    setMembersLoading(true);
    try {
      const data = await bandMemberService.getMembers(currentBand.id);
      setBandMembers(data);
    } catch (error: any) {
      console.error('Failed to fetch band members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  const fetchShowPayments = async (showId: number) => {
    setPaymentsLoading(true);
    try {
      const data = await showService.getShowPayments(showId);
      setPayments(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch payments');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // Modal handlers
  const showCreateModal = () => {
    setEditingShow(null);
    setOriginalStatus(null);
    setSelectedStatus(ShowStatus.UPCOMING);
    setPayments([]);
    form.resetFields();
    setFileList([]);
    setIsModalVisible(true);
  };

  const showEditModal = async (show: Show) => {
    setEditingShow(show);
    setOriginalStatus(show.status);
    setSelectedStatus(show.status);
    form.setFieldsValue({
      venue: show.venue,
      show_date: dayjs(show.show_date),
      show_time: show.show_time ? dayjs(show.show_time, 'HH:mm:ss') : null,
      event_manager: show.event_manager,
      show_members: show.show_members || [],
      payment: show.payment,
      band_fund_amount: show.band_fund_amount,
      piece_count: show.piece_count,
      status: show.status,
      description: show.description,
    });
    setFileList([]);
    setIsModalVisible(true);
    
    // Fetch payments if status is complete
    if (show.status === ShowStatus.COMPLETE_PAYMENT_RECEIVED) {
      await fetchShowPayments(show.id);
    } else {
      setPayments([]);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setFileList([]);
    setEditingShow(null);
    setOriginalStatus(null);
    setSelectedStatus(ShowStatus.UPCOMING);
    setPayments([]);
    setNewPaymentName('');
    setNewPaymentAmount(null);
    setNewPaymentNotes('');
    setIsModalVisible(false);
  };

  const handleModalSubmit = async (values: any) => {
    if (!currentBand) return;
    
    setModalLoading(true);
    try {
      const showData: ShowCreate | ShowUpdate = {
        venue: values.venue,
        show_date: values.show_date.format('YYYY-MM-DD'),
        show_time: values.show_time ? values.show_time.format('HH:mm:ss') : null,
        event_manager: values.event_manager || null,
        show_members: values.show_members || null,
        payment: values.payment || null,
        band_fund_amount: values.band_fund_amount || null,
        piece_count: values.piece_count || null,
        status: values.status || ShowStatus.UPCOMING,
        description: values.description || null,
      };

      let savedShow: Show;
      
      if (editingShow) {
        // Check if status changed from complete to something else - reset payments
        if (originalStatus === ShowStatus.COMPLETE_PAYMENT_RECEIVED && 
            values.status !== ShowStatus.COMPLETE_PAYMENT_RECEIVED) {
          // Delete all existing payments
          for (const payment of payments) {
            await showService.deletePayment(editingShow.id, payment.id);
          }
        }
        
        savedShow = await showService.updateShow(editingShow.id, showData);
        message.success('Show updated successfully!');
      } else {
        savedShow = await showService.createShow({
          ...showData,
          band_id: currentBand.id,
        } as ShowCreate);
        message.success('Show created successfully!');
      }

      // Upload poster if selected
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0];
        if (file instanceof File) {
          await showService.uploadPoster(savedShow.id, file);
        }
      }

      await fetchShows();
      handleModalCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to save show');
    } finally {
      setModalLoading(false);
    }
  };

  // Drawer handlers
  const openDrawer = async (show: Show) => {
    setSelectedShow(show);
    setIsDrawerVisible(true);
    setDrawerLoading(true);
    
    try {
      const showData = await showService.getShow(show.id);
      setSelectedShow(showData);
      
      // Fetch payments for display
      if (showData.status === ShowStatus.COMPLETE_PAYMENT_RECEIVED) {
        const paymentsData = await showService.getShowPayments(show.id);
        setPayments(paymentsData);
      } else {
        setPayments([]);
      }
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to load show details');
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setSelectedShow(null);
    setPayments([]);
    setIsDrawerVisible(false);
  };

  const handleDeleteShow = async (showId: number) => {
    try {
      await showService.deleteShow(showId);
      message.success('Show deleted successfully!');
      await fetchShows();
      handleModalCancel();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete show');
    }
  };

  // Payment handlers (in edit modal)
  const handleAddPayment = async () => {
    if (!editingShow || !newPaymentName || !newPaymentAmount) {
      message.warning('Please enter member name and amount');
      return;
    }
    
    setAddingPayment(true);
    try {
      const paymentData: ShowPaymentCreate = {
        member_name: newPaymentName,
        amount: newPaymentAmount,
        notes: newPaymentNotes || null,
      };
      
      await showService.createPayment(editingShow.id, paymentData);
      message.success('Payment added!');
      await fetchShowPayments(editingShow.id);
      setNewPaymentName('');
      setNewPaymentAmount(null);
      setNewPaymentNotes('');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to add payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!editingShow) return;
    
    try {
      await showService.deletePayment(editingShow.id, paymentId);
      message.success('Payment deleted!');
      await fetchShowPayments(editingShow.id);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete payment');
    }
  };

  // Handle status change in form
  const handleStatusChange = async (newStatus: ShowStatus) => {
    setSelectedStatus(newStatus);
    
    // If editing and changing to complete, fetch existing payments
    if (editingShow && newStatus === ShowStatus.COMPLETE_PAYMENT_RECEIVED) {
      await fetchShowPayments(editingShow.id);
    }
  };

  // Upload props
  const uploadProps = {
    fileList,
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return false;
      }
      
      setFileList([{
        uid: file.name,
        name: file.name,
        status: 'done',
        originFileObj: file,
      } as any]);
      
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return null;
    return dayjs(timeStr, 'HH:mm:ss').format('h:mm A');
  };

  const formatDate = (dateStr: string) => {
    return dayjs(dateStr).format('MMM D, YYYY');
  };

  // No band selected
  if (!currentBand) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <CalendarOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
        <Title level={3}>No Band Selected</Title>
        <Text type="secondary">Please select a band from the dropdown or create a new one.</Text>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Shows</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          New Show
        </Button>
      </div>

      {/* Shows Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : shows.length === 0 ? (
        <Empty
          description="No shows yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button type="primary" onClick={showCreateModal}>Create First Show</Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {shows.map((show) => (
            <Col xs={24} sm={12} md={8} lg={6} key={show.id}>
              <Card
                hoverable
                onClick={() => openDrawer(show)}
                cover={
                  show.poster ? (
                    <div style={{ height: 160, overflow: 'hidden' }}>
                      <img
                        alt={show.venue}
                        src={`http://localhost:8000${show.poster}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      height: 160, 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CalendarOutlined style={{ fontSize: 48, color: 'rgba(255,255,255,0.8)' }} />
                    </div>
                  )
                }
              >
                <Card.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong ellipsis style={{ maxWidth: '70%' }}>{show.venue}</Text>
                      <Tag color={statusColors[show.status]} style={{ marginLeft: 8 }}>
                        {show.status === ShowStatus.COMPLETE_PAYMENT_RECEIVED ? 'Paid' : show.status}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <CalendarOutlined style={{ marginRight: 8 }} />
                        {formatDate(show.show_date)}
                      </div>
                      {show.show_time && (
                        <div>
                          <ClockCircleOutlined style={{ marginRight: 8 }} />
                          {formatTime(show.show_time)}
                        </div>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingShow ? 'Edit Show' : 'Create New Show'}
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
            name="venue"
            label="Venue"
            rules={[{ required: true, message: 'Please enter the venue' }]}
          >
            <Input prefix={<EnvironmentOutlined />} placeholder="Enter venue name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="show_date"
                label="Date"
                rules={[{ required: true, message: 'Please select a date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="show_time"
                label="Time"
              >
                <TimePicker style={{ width: '100%' }} format="h:mm A" use12Hours />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="event_manager"
            label="Event Manager"
          >
            <Input placeholder="Event manager name" />
          </Form.Item>

          <Form.Item
            name="show_members"
            label="Show Members"
          >
            <Select
              mode="tags"
              placeholder="Select or type member names"
              loading={membersLoading}
              options={bandMembers.map(m => ({ 
                label: m.name || m.email || 'Unknown', 
                value: m.name || m.email || 'Unknown' 
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="piece_count"
                label="Piece Count"
              >
                <InputNumber style={{ width: '100%' }} placeholder="e.g., 4" min={1} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="status"
                label="Status"
                initialValue={ShowStatus.UPCOMING}
              >
                <Select onChange={handleStatusChange}>
                  <Select.Option value={ShowStatus.UPCOMING}>Upcoming</Select.Option>
                  <Select.Option value={ShowStatus.DONE}>Done</Select.Option>
                  <Select.Option value={ShowStatus.COMPLETE_PAYMENT_RECEIVED}>Complete - Payment Received</Select.Option>
                  <Select.Option value={ShowStatus.CANCELLED}>Cancelled</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={2} placeholder="Additional notes about the show" />
          </Form.Item>

          <Form.Item label="Poster">
            <Upload {...uploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>Select Poster Image</Button>
            </Upload>
          </Form.Item>

          {/* Payment Section - Show for all statuses */}
          <Divider orientation="left">
            <DollarOutlined /> Payment Details
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payment"
                label="Total Payment"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  prefix="₹" 
                  placeholder="0"
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="band_fund_amount"
                label="Band Fund Contribution"
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  prefix="₹" 
                  placeholder="0"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Member Payments - Only show when status is Complete */}
          {selectedStatus === ShowStatus.COMPLETE_PAYMENT_RECEIVED && (
            <>
              {originalStatus !== ShowStatus.COMPLETE_PAYMENT_RECEIVED && editingShow && (
                <Alert
                  message="Status changed to Complete"
                  description="You can now add payment details for this show."
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              {editingShow && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong><TeamOutlined /> Member Payments</Text>
                  </div>

                  {paymentsLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Spin />
                    </div>
                  ) : (
                    <>
                      {/* Existing Payments */}
                      {payments.length > 0 && (
                        <List
                          size="small"
                          bordered
                          style={{ marginBottom: 16 }}
                          dataSource={payments}
                          renderItem={(payment) => (
                            <List.Item
                              actions={[
                                <Popconfirm
                                  key="delete"
                                  title="Delete this payment?"
                                  onConfirm={() => handleDeletePayment(payment.id)}
                                  okText="Yes"
                                  cancelText="No"
                                >
                                  <Button size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              ]}
                            >
                              <List.Item.Meta
                                title={payment.member_name}
                                description={payment.notes}
                              />
                              <Text strong>₹{payment.amount.toLocaleString()}</Text>
                            </List.Item>
                          )}
                        />
                      )}

                      {/* Add New Payment */}
                      <Card size="small" title="Add Member Payment">
                        <Row gutter={8}>
                          <Col span={8}>
                            <Select
                              showSearch
                              style={{ width: '100%' }}
                              placeholder="Member name"
                              value={newPaymentName || undefined}
                              onChange={setNewPaymentName}
                              options={[
                                ...bandMembers.map(m => ({ 
                                  label: m.name || m.email || 'Unknown', 
                                  value: m.name || m.email || 'Unknown' 
                                })),
                                ...(form.getFieldValue('show_members') || [])
                                  .filter((name: string) => !bandMembers.some(m => (m.name || m.email) === name))
                                  .map((name: string) => ({ label: name, value: name }))
                              ]}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                            />
                          </Col>
                          <Col span={6}>
                            <InputNumber 
                              style={{ width: '100%' }} 
                              placeholder="Amount"
                              prefix="₹"
                              min={0}
                              value={newPaymentAmount}
                              onChange={(val) => setNewPaymentAmount(val)}
                            />
                          </Col>
                          <Col span={6}>
                            <Input 
                              placeholder="Notes (optional)"
                              value={newPaymentNotes}
                              onChange={(e) => setNewPaymentNotes(e.target.value)}
                            />
                          </Col>
                          <Col span={4}>
                            <Button 
                              type="primary" 
                              onClick={handleAddPayment}
                              loading={addingPayment}
                              block
                            >
                              Add
                            </Button>
                          </Col>
                        </Row>
                      </Card>
                    </>
                  )}
                </>
              )}
            </>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
            {editingShow && (
              <Popconfirm
                title="Delete this show?"
                description="This action cannot be undone."
                onConfirm={() => handleDeleteShow(editingShow.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button danger style={{ marginRight: 8 }}>
                  Delete Show
                </Button>
              </Popconfirm>
            )}
            <Button onClick={handleModalCancel} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={modalLoading}>
              {editingShow ? 'Update' : 'Create'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Show Details Drawer - View Only */}
      <Drawer
        title="Show Details"
        placement="right"
        width={500}
        onClose={closeDrawer}
        open={isDrawerVisible}
        extra={
          selectedShow && (
            <Button 
              type="primary"
              icon={<EditOutlined />} 
              onClick={() => {
                closeDrawer();
                showEditModal(selectedShow);
              }}
            >
              Edit
            </Button>
          )
        }
      >
        {drawerLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : selectedShow ? (
          <div>
            {/* Poster */}
            {selectedShow.poster && (
              <div style={{ marginBottom: 24 }}>
                <img
                  src={`http://localhost:8000${selectedShow.poster}`}
                  alt={selectedShow.venue}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </div>
            )}

            {/* Details */}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Venue">{selectedShow.venue}</Descriptions.Item>
              <Descriptions.Item label="Date">{formatDate(selectedShow.show_date)}</Descriptions.Item>
              <Descriptions.Item label="Time">{formatTime(selectedShow.show_time) || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selectedShow.status]}>{selectedShow.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Event Manager">{selectedShow.event_manager || '-'}</Descriptions.Item>
              <Descriptions.Item label="Piece Count">{selectedShow.piece_count || '-'}</Descriptions.Item>
              <Descriptions.Item label="Show Members">
                {selectedShow.show_members?.length ? (
                  selectedShow.show_members.map((m, i) => <Tag key={i}>{m}</Tag>)
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Description">{selectedShow.description || '-'}</Descriptions.Item>
            </Descriptions>

            {/* Financials - Show for all statuses */}
            {(selectedShow.payment || selectedShow.band_fund_amount) && (
              <>
                <Divider orientation="left">
                  <DollarOutlined /> Financials
                </Divider>
                
                <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Total Payment">
                    ₹{selectedShow.payment?.toLocaleString() || '0'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Band Fund">
                    ₹{selectedShow.band_fund_amount?.toLocaleString() || '0'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            {/* Member Payments - Only show if status is complete */}
            {selectedShow.status === ShowStatus.COMPLETE_PAYMENT_RECEIVED && payments.length > 0 && (
              <>
                <div style={{ marginBottom: 12 }}>
                  <Text strong><TeamOutlined /> Member Payments</Text>
                </div>

                <List
                  size="small"
                  bordered
                  dataSource={payments}
                  renderItem={(payment) => (
                    <List.Item>
                      <List.Item.Meta
                        title={payment.member_name}
                        description={payment.notes}
                      />
                      <Text strong>₹{payment.amount.toLocaleString()}</Text>
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default Shows;