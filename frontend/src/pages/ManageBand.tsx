import React, { useState, useEffect } from 'react';
import { Typography, Card, Button, Space, Modal, Form, Input, DatePicker, message, Avatar, Divider, Upload, Popconfirm, List, Tag, Switch, Spin } from 'antd';
import { EditOutlined, TeamOutlined, CalendarOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined, ExclamationCircleOutlined, PlusOutlined, UserOutlined, MailOutlined, PhoneOutlined, CrownOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useBand } from '../contexts/BandContext';
import { bandService } from '../services/bandService';
import { bandMemberService } from '../services/bandMemberService';
import { BandMember, BandMemberCreate, BandMemberUpdate } from '../types/bandMember';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ManageBand: React.FC = () => {
  const { user } = useAuth();
  const { currentBand, refreshBands } = useBand();
  
  // Band edit state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  // Band members state
  const [members, setMembers] = useState<BandMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [editingMember, setEditingMember] = useState<BandMember | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [memberForm] = Form.useForm();
  const [memberFileList, setMemberFileList] = useState<UploadFile[]>([]);

  // Check if current user is admin
  const currentUserIsAdmin = members.some(m => m.user_id === user?.id && m.is_admin);

  // Fetch members when band changes
  useEffect(() => {
    if (currentBand) {
      fetchMembers();
    }
  }, [currentBand?.id]);

  const fetchMembers = async () => {
    if (!currentBand) return;
    
    setMembersLoading(true);
    try {
      const data = await bandMemberService.getMembers(currentBand.id);
      setMembers(data);
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to fetch members');
    } finally {
      setMembersLoading(false);
    }
  };

  if (!currentBand) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <TeamOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
        <Title level={3}>No Band Selected</Title>
        <Text type="secondary">Please select a band from the dropdown or create a new one.</Text>
      </div>
    );
  }

  // Band edit handlers
  const showModal = () => {
    form.setFieldsValue({
      name: currentBand.name,
      description: currentBand.description || '',
      established_date: currentBand.established_date ? dayjs(currentBand.established_date) : null,
    });
    setFileList([]);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setIsModalVisible(false);
  };

  const handleDeleteBand = async () => {
    try {
      setDeleteLoading(true);
      await bandService.deleteBand(currentBand.id);
      message.success('Band deleted successfully!');
      await refreshBands();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.detail || 'Failed to delete band');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      
      const updateData: any = {};

if (values.name) {
  updateData.name = values.name;
}
if (values.description !== undefined && values.description !== '') {
  updateData.description = values.description;
}
if (values.established_date) {
  updateData.established_date = values.established_date.format('YYYY-MM-DD');
}

      await bandService.updateBand(currentBand.id, updateData);
      
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0];
        if (file instanceof File) {
          await bandService.uploadLogo(currentBand.id, file);
        }
      }
      
      await refreshBands();
      
      message.success('Band details updated successfully!');
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
    } catch (error: any) {
      console.error('Update error:', error);
      message.error(error.response?.data?.detail || 'Failed to update band details');
    } finally {
      setLoading(false);
    }
  };

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

  const memberUploadProps = {
    fileList: memberFileList,
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
      
      setMemberFileList([{
        uid: file.name,
        name: file.name,
        status: 'done',
        originFileObj: file,
      } as any]);
      
      return false;
    },
    onRemove: () => {
      setMemberFileList([]);
    },
    maxCount: 1,
  };

  const logoUrl = currentBand.logo ? `http://localhost:8000${currentBand.logo}` : null;

  // Member handlers
  const showMemberModal = (member?: BandMember) => {
    if (member) {
      setEditingMember(member);
      memberForm.setFieldsValue({
        name: member.name || '',
        email: member.email || '',
        phone: member.phone || '',
        role: member.role || '',
        is_admin: member.is_admin,
      });
    } else {
      setEditingMember(null);
      memberForm.resetFields();
      memberForm.setFieldsValue({ is_admin: false });
    }
    setMemberFileList([]);
    setIsMemberModalVisible(true);
  };

  const handleMemberModalCancel = () => {
    setIsMemberModalVisible(false);
    setEditingMember(null);
    memberForm.resetFields();
    setMemberFileList([]);
  };

  const handleMemberSave = async (values: any) => {
    try {
      setMemberLoading(true);
      
      let memberId: number;
      
      if (editingMember) {
        const updateData: BandMemberUpdate = {
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          role: values.role || null,
          is_admin: values.is_admin,
        };
        await bandMemberService.updateMember(currentBand.id, editingMember.id, updateData);
        memberId = editingMember.id;
        message.success('Member updated successfully!');
      } else {
        const createData: BandMemberCreate = {
          name: values.name,
          email: values.email || null,
          phone: values.phone || null,
          role: values.role || null,
          is_admin: values.is_admin,
        };
        const newMember = await bandMemberService.createMember(currentBand.id, createData);
        memberId = newMember.id;
        message.success('Member added successfully!');
      }
      
      // Upload profile picture if selected
      if (memberFileList.length > 0) {
        const file = memberFileList[0].originFileObj || memberFileList[0];
        if (file instanceof File) {
          await bandMemberService.uploadProfilePicture(currentBand.id, memberId, file);
        }
      }
      
      await fetchMembers();
      handleMemberModalCancel();
    } catch (error: any) {
      console.error('Member save error:', error);
      message.error(error.response?.data?.detail || 'Failed to save member');
    } finally {
      setMemberLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      setDeletingMemberId(memberId);
      await bandMemberService.deleteMember(currentBand.id, memberId);
      message.success('Member removed successfully!');
      await fetchMembers();
    } catch (error: any) {
      console.error('Delete member error:', error);
      message.error(error.response?.data?.detail || 'Failed to remove member');
    } finally {
      setDeletingMemberId(null);
    }
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32 
      }}>
        <Title level={2} style={{ margin: 0 }}>Band Details</Title>
        {currentUserIsAdmin && (
          <Space>
            <Popconfirm
              title="Delete Band"
              description={
                <div>
                  <p>Are you sure you want to delete this band?</p>
                  <p style={{ color: '#ff4d4f', margin: 0 }}>
                    This action cannot be undone. All band data will be permanently deleted.
                  </p>
                </div>
              }
              onConfirm={handleDeleteBand}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteLoading }}
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
            >
              <Button 
                danger
                icon={<DeleteOutlined />} 
                size="large"
                loading={deleteLoading}
              >
                Delete Band
              </Button>
            </Popconfirm>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="large"
              onClick={showModal}
            >
              Edit Band
            </Button>
          </Space>
        )}
      </div>

      {/* Main Band Card */}
      <Card 
        bordered={false}
        style={{ 
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: 24
        }}
      >
        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Logo Section */}
          <div style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              icon={<TeamOutlined />}
              src={logoUrl}
              style={{ 
                backgroundColor: '#1890ff',
                marginBottom: 16
              }}
            />
            {currentBand.established_date && (
              <div style={{ 
                background: '#f0f0f0', 
                padding: '8px 16px', 
                borderRadius: 8,
                marginTop: 16
              }}>
                <Text type="secondary" style={{ fontSize: 12 }}>EST.</Text>
                <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  {new Date(currentBand.established_date).getFullYear()}
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ marginTop: 0, marginBottom: 8 }}>
              {currentBand.name}
            </Title>
            
            {currentBand.established_date && (
              <Space style={{ marginBottom: 16 }}>
                <CalendarOutlined style={{ color: '#1890ff' }} />
                <Text type="secondary">
                  Established on {new Date(currentBand.established_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </Space>
            )}

            {currentBand.description && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div>
                  <Space style={{ marginBottom: 8 }}>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <Text strong>About</Text>
                  </Space>
                  <Paragraph style={{ marginLeft: 24, marginBottom: 0 }}>
                    {currentBand.description}
                  </Paragraph>
                </div>
              </>
            )}

            {!currentBand.description && !currentBand.established_date && (
              <Text type="secondary">
                {currentUserIsAdmin ? 'Click "Edit Band" to add more details about your band' : 'No additional details available'}
              </Text>
            )}
          </div>
        </div>
      </Card>

      {/* Band Members Card */}
      <Card 
        title={
          <Space>
            <TeamOutlined />
            <span>Band Members</span>
            <Tag color="blue">{members.length}</Tag>
          </Space>
        }
        extra={currentUserIsAdmin && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => showMemberModal()}
          >
            Add Member
          </Button>
        )}
        bordered={false}
        style={{ 
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        {membersLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <UserOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <div>
              <Text type="secondary">No members yet. {currentUserIsAdmin && 'Add your first band member!'}</Text>
            </div>
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={members}
            renderItem={(member) => (
              <List.Item
                actions={currentUserIsAdmin ? [
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => showMemberModal(member)}
                  />,
                  <Popconfirm
                    title="Remove Member"
                    description="Are you sure you want to remove this member?"
                    onConfirm={() => handleDeleteMember(member.id)}
                    okText="Yes"
                    cancelText="No"
                    okButtonProps={{ danger: true, loading: deletingMemberId === member.id }}
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      loading={deletingMemberId === member.id}
                    />
                  </Popconfirm>
                ] : []}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      size={48} 
                      icon={<UserOutlined />}
                      src={member.profile_picture ? `http://localhost:8000${member.profile_picture}` : undefined}
                      style={{ backgroundColor: member.is_admin ? '#faad14' : '#1890ff' }}
                    />
                  }
                  title={
                    <Space>
                      <span>{member.name}</span>
                      {member.is_admin && (
                        <Tag color="gold" icon={<CrownOutlined />}>Admin</Tag>
                      )}
                      {member.user_id && (
                        <Tag color="green">Registered</Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      {member.role && <Text type="secondary">{member.role}</Text>}
                      <Space split={<Divider type="vertical" />}>
                        {member.email && (
                          <Space size={4}>
                            <MailOutlined style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{member.email}</Text>
                          </Space>
                        )}
                        {member.phone && (
                          <Space size={4}>
                            <PhoneOutlined style={{ fontSize: 12 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>{member.phone}</Text>
                          </Space>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Edit Band Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Edit Band Details</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Band Name"
            rules={[
              { required: true, message: 'Please enter band name!' },
              { min: 2, message: 'Band name must be at least 2 characters!' }
            ]}
          >
            <Input size="large" placeholder="Enter band name" prefix={<TeamOutlined />} />
          </Form.Item>

          <Form.Item
            name="established_date"
            label="Established Date"
          >
            <DatePicker 
              size="large" 
              style={{ width: '100%' }}
              placeholder="Select establishment date"
            />
          </Form.Item>

          <Form.Item
            label="Logo"
            extra="Upload a logo image (max 5MB)"
          >
            <Upload {...uploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>Select Logo</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={4} 
              placeholder="Tell us about your band..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel} size="large">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Member Modal */}
      <Modal
        title={
          <Space>
            {editingMember ? <EditOutlined /> : <PlusOutlined />}
            <span>{editingMember ? 'Edit Member' : 'Add Member'}</span>
          </Space>
        }
        open={isMemberModalVisible}
        onCancel={handleMemberModalCancel}
        footer={null}
        width={500}
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleMemberSave}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter member name!' }]}
          >
            <Input size="large" placeholder="Enter name" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ type: 'email', message: 'Please enter a valid email!' }]}
            extra="If they sign up with this email, they'll automatically join this band"
          >
            <Input size="large" placeholder="Enter email" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
          >
            <Input size="large" placeholder="Enter phone number" prefix={<PhoneOutlined />} />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            extra="e.g., Guitarist, Vocalist, Drummer"
          >
            <Input size="large" placeholder="Enter musical role" />
          </Form.Item>

          <Form.Item
            label="Profile Picture"
            extra="Upload a profile image (max 5MB)"
          >
            <Upload {...memberUploadProps} listType="picture">
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="is_admin"
            label="Admin Access"
            valuePropName="checked"
          >
            <Switch checkedChildren="Admin" unCheckedChildren="Member" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleMemberModalCancel} size="large">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={memberLoading} size="large">
                {editingMember ? 'Save Changes' : 'Add Member'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManageBand;