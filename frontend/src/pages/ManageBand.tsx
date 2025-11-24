import React, { useState } from 'react';
import { Typography, Card, Button, Space, Modal, Form, Input, DatePicker, message, Avatar, Divider, Upload, Popconfirm } from 'antd';
import { EditOutlined, TeamOutlined, CalendarOutlined, FileTextOutlined, UploadOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useBand } from '../contexts/BandContext';
import { bandService } from '../services/bandService';
import dayjs from 'dayjs';
import type { UploadFile } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ManageBand: React.FC = () => {
  const { currentBand, refreshBands } = useBand();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  if (!currentBand) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <TeamOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
        <Title level={3}>No Band Selected</Title>
        <Text type="secondary">Please select a band from the dropdown or create a new one.</Text>
      </div>
    );
  }

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
      // Navigate will happen automatically when currentBand becomes null
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
      
      // First update band details
      const updateData = {
        name: values.name,
        description: values.description || null,
        established_date: values.established_date ? values.established_date.format('YYYY-MM-DD') : null,
      };

      await bandService.updateBand(currentBand.id, updateData);
      
      // If there's a file, upload it
      console.log('FileList:', fileList);
      console.log('FileList length:', fileList.length);
      
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj || fileList[0];
        console.log('Uploading file:', file);
        
        if (file instanceof File) {
          await bandService.uploadLogo(currentBand.id, file);
          console.log('File uploaded successfully');
        } else {
          console.log('Not a File object:', file);
        }
      } else {
        console.log('No file selected');
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

  const handleDeleteLogo = async () => {
    try {
      setLoading(true);
      await bandService.deleteLogo(currentBand.id);
      await refreshBands();
      message.success('Logo deleted successfully!');
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Failed to delete logo');
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
      
      console.log('File selected:', file);
      
      // Store the actual File object
      setFileList([{
        uid: file.name,
        name: file.name,
        status: 'done',
        originFileObj: file,
      } as any]);
      
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
    maxCount: 1,
  };

  const logoUrl = currentBand.logo ? `http://localhost:8000${currentBand.logo}` : null;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32 
      }}>
        <Title level={2} style={{ margin: 0 }}>Band Details</Title>
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
                Click "Edit Band" to add more details about your band
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
          </Space>
        }
        bordered={false}
        style={{ 
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
      >
        <Text type="secondary">Band member management coming soon...</Text>
      </Card>

      {/* Edit Modal */}
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
    </div>
  );
};

export default ManageBand;